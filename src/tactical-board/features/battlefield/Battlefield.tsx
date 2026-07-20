/**
 * @packageDocumentation
 * Surface interactive du plateau tactique.
 *
 * Ce module gère le rendu DOM/SVG de la grille, des unités et annotations,
 * ainsi que les interactions de placement, sélection, déplacement et dessin.
 */
import {
  CircleOff,
  EyeOff,
  ShieldAlert,
  X,
} from 'lucide-react'
import {
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type RefObject,
} from 'react'
import {
  selectedUnitIds,
  toggleUnitSelection,
  type BoardSelection,
} from '@/tactical-board/model/boardSelection'
import type {
  BoardTool,
  MarkerKind,
} from '@/tactical-board/model/boardInteraction'
import type {
  ArrowAnnotation,
  ArrowStyle,
  Faction,
  MarkerAnnotation,
  Position,
  ScenarioDocumentV1,
  TacticalUnit,
  UnitType,
} from '@/tactical-board/model/tacticalBoardTypes'
import {
  cellKey,
  coordinateLabel,
  getAnnotationAt,
  isPositionInGrid,
  positionFromClientPoint as positionFromClientPointInBounds,
  samePosition,
} from './battlefieldGeometry'
import { ArrowLayer } from './ArrowLayer'
import { DragGhostLayer } from './DragGhostLayer'
import {
  calculateUnitDragPreview,
  type DragPreviewState,
} from './unitDragPreview'
import { MarkerLayer } from './MarkerLayer'
import { UnitVisual } from './UnitVisual'
import { statusDetails, unitClassName } from './unitVisualModel'
import { useArrowDrawing } from './useArrowDrawing'
import styles from './Battlefield.module.css'

export interface BattlefieldProps {
  scenario: ScenarioDocumentV1
  tool: BoardTool
  zoom: number
  selection: BoardSelection
  placementType: UnitType | null
  placementFaction: Faction | null
  arrowStyle: ArrowStyle
  arrowColor: string
  markerKind: MarkerKind
  markerColor: string
  assetUrls: Readonly<Record<string, string>>
  viewportRef: RefObject<HTMLDivElement | null>
  onSelectionChange: (selection: BoardSelection) => void
  onPlaceUnit: (type: UnitType, faction: Faction, position: Position) => void
  onMoveUnit: (unitId: string, position: Position) => void
  onMoveUnits: (unitIds: readonly string[], delta: Position) => void
  onReachObjective?: (unitId: string, objectiveUnitId: string) => void
  onDeleteUnit: (unitId: string) => void
  onAddArrow: (start: Position, end: Position, style: ArrowStyle, color: string) => void
  onAddMarker: (position: Position, markerType: MarkerAnnotation['markerType'], color: string) => void
  onDeleteAnnotation: (annotationId: string) => void
  onNotify: (message: string) => void
}

interface DragState {
  anchorPosition: Position
  anchorUnitId: string
  unitIds: readonly string[]
  pointerId: number
  clientX: number
  clientY: number
  lastClientX: number
  lastClientY: number
  scrollLeft: number
  scrollTop: number
  moved: boolean
  selectOnDrag: boolean
  selectionChanged: boolean
}
/**
 * Cette fonction intervient sur le sujet “marker Type From Toolbar” dans tactical-board.
 *
 * Fichier: src/tactical-board/features/battlefield/Battlefield.tsx
 * Si tu lis ce fichier pour apprendre, regarde d’abord markerTypeFromToolbar dans Battlefield.tsx.
 */


function markerTypeFromToolbar(kind: MarkerKind): MarkerAnnotation['markerType'] {
  if (kind === 'warning') return 'danger'
  if (kind === 'rally-point') return 'rally'
  return 'objective'
}

/** Surface interactive du domaine Tactical Board, indépendante de l'état Zustand. */
export const Battlefield = forwardRef<HTMLDivElement, BattlefieldProps>(function Battlefield(
  {
    scenario,
    tool,
    zoom,
    selection,
    placementType,
    placementFaction,
    arrowStyle,
    arrowColor,
    markerKind,
    markerColor,
    assetUrls,
    viewportRef,
    onSelectionChange,
    onPlaceUnit,
    onMoveUnit,
    onMoveUnits,
    onReachObjective,
    onDeleteUnit,
    onAddArrow,
    onAddMarker,
    onDeleteAnnotation,
    onNotify,
  },
  boardRef,
) {
  const [unitDragPreview, setDragPreview] = useState<DragPreviewState | null>(null)
  const dragRef = useRef<DragState | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const suppressClickRef = useRef(false)
  const suppressClickTimerRef = useRef<number | null>(null)

  useEffect(() => {
    if (dragRef.current) {
      dragRef.current = null
      setDragPreview(null)
    }
  }, [scenario, tool])

  useEffect(
    () => () => {
      dragRef.current = null
      if (suppressClickTimerRef.current !== null) {
        window.clearTimeout(suppressClickTimerRef.current)
      }
    },
    [],
  )

  const unitByCell = useMemo(
    () => new Map(scenario.units.map((unit) => [cellKey(unit.position), unit])),
    [scenario.units],
  )
  const unitById = useMemo(
    () => new Map(scenario.units.map((unit) => [unit.id, unit])),
    [scenario.units],
  )
  const factionById = useMemo(
    () => new Map(scenario.factions.map((faction) => [faction.id, faction])),
    [scenario.factions],
  )

  const positions = useMemo(() => {
    const result: Position[] = []
    for (let row = 0; row < scenario.grid.rows; row += 1) {
      for (let column = 0; column < scenario.grid.columns; column += 1) {
        result.push({ row, column })
      }
    }
    return result
  }, [scenario.grid.columns, scenario.grid.rows])

  const selectedUnitId = selection?.kind === 'unit' ? selection.id : null
  const selectedUnitIdSet = useMemo(
    () => new Set(selectedUnitIds(selection)),
    [selection],
  )
  const selectedAnnotationId = selection?.kind === 'annotation' ? selection.id : null

  const canReachObjective = (unit: TacticalUnit, target: TacticalUnit) =>
    unit.typeId === 'commander' &&
    target.typeId === 'objective' &&
    factionById.get(target.factionId)?.role === 'objective' &&
    Boolean(onReachObjective)

  const tryReachObjective = (unit: TacticalUnit, target: TacticalUnit) => {
    if (!canReachObjective(unit, target)) return false
    onReachObjective?.(unit.id, target.id)
    return true
  }

  const positionFromClientPoint = (clientX: number, clientY: number): Position | null => {
    const grid = gridRef.current
    if (!grid) return null
    const bounds = grid.getBoundingClientRect()
    return positionFromClientPointInBounds(bounds, scenario.grid, clientX, clientY)
  }

  const {
    arrowPreview,
    arrowStart,
    handleArrowCellClick,
    handleCellPointerDown,
    handleCellPointerMove,
    handleCellPointerUp,
    setArrowPreview,
  } = useArrowDrawing({
    arrowColor,
    arrowStyle,
    enabled: tool === 'arrow',
    onAddArrow,
    positionFromClientPoint,
    suppressClickRef,
  })

  const rememberDragPreview = (next: DragPreviewState | null) => {
    setDragPreview(next)
  }

  const calculateDragPreview = (
    drag: DragState,
    clientX: number,
    clientY: number,
  ): DragPreviewState => {
    const viewport = viewportRef.current
    const target = positionFromClientPoint(clientX, clientY)
    return calculateUnitDragPreview({
      canReachObjective,
      clientX,
      clientY,
      currentScrollLeft: viewport?.scrollLeft ?? drag.scrollLeft,
      currentScrollTop: viewport?.scrollTop ?? drag.scrollTop,
      drag,
      scenario,
      target,
      unitByCell,
      unitById,
    })
  }

  const moveSelectedUnit = (position: Position) => {
    if (!selectedUnitId) return false
    const unit = scenario.units.find((candidate) => candidate.id === selectedUnitId)
    if (!unit || samePosition(unit.position, position)) return false
    const target = unitByCell.get(cellKey(position))
    if (target && tryReachObjective(unit, target)) return true
    if (target) {
      onNotify('Cette case est déjà occupée.')
      return true
    }
    onMoveUnit(unit.id, position)
    return true
  }

  const handleCellClick = (
    event: React.MouseEvent<HTMLButtonElement>,
    position: Position,
  ) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false
      return
    }

    const unit = unitByCell.get(cellKey(position))
    if (tool === 'place') {
      if (!placementType || !placementFaction) {
        onNotify('Choisissez un type d’unité et une faction.')
      } else if (unit) {
        onNotify('Cette case est déjà occupée.')
      } else {
        onPlaceUnit(placementType, placementFaction, position)
      }
      return
    }

    if (tool === 'arrow') {
      handleArrowCellClick(position)
      return
    }

    if (tool === 'marker') {
      const existing = scenario.annotations.find(
        (annotation) => annotation.kind === 'marker' && samePosition(annotation.position, position),
      )
      if (existing) {
        onNotify('Un marqueur est déjà présent sur cette case.')
      } else {
        onAddMarker(position, markerTypeFromToolbar(markerKind), markerColor)
      }
      return
    }

    if (tool === 'erase') {
      const annotation = getAnnotationAt(scenario.annotations, position)
      if (annotation) onDeleteAnnotation(annotation.id)
      else onNotify('Aucune annotation à effacer ici.')
      return
    }

    if (tool === 'delete') {
      if (unit) onDeleteUnit(unit.id)
      return
    }

    if (event.shiftKey) return

    if (unit) {
      onSelectionChange({ kind: 'unit', id: unit.id })
      return
    }
    if (moveSelectedUnit(position)) return
    const annotation = getAnnotationAt(scenario.annotations, position)
    onSelectionChange(annotation ? { kind: 'annotation', id: annotation.id } : null)
  }

  const handleUnitPointerDown = (event: PointerEvent<HTMLButtonElement>, unit: TacticalUnit) => {
    if (
      tool !== 'select' ||
      event.shiftKey ||
      event.button !== 0 ||
      event.isPrimary === false ||
      dragRef.current
    ) return
    const moveSelection =
      selection?.kind === 'units' && selectedUnitIdSet.has(unit.id)
        ? selectedUnitIds(selection)
        : [unit.id]
    const viewport = viewportRef.current
    dragRef.current = {
      anchorPosition: unit.position,
      anchorUnitId: unit.id,
      unitIds: [...new Set(moveSelection)],
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      lastClientX: event.clientX,
      lastClientY: event.clientY,
      scrollLeft: viewport?.scrollLeft ?? 0,
      scrollTop: viewport?.scrollTop ?? 0,
      moved: false,
      selectOnDrag: !selectedUnitIdSet.has(unit.id),
      selectionChanged: false,
    }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  const handleUnitPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    drag.lastClientX = event.clientX
    drag.lastClientY = event.clientY
    if (Math.hypot(event.clientX - drag.clientX, event.clientY - drag.clientY) >= 6) drag.moved = true
    if (!drag.moved) return
    event.preventDefault()
    if (drag.selectOnDrag && !drag.selectionChanged) {
      drag.selectionChanged = true
      onSelectionChange({ kind: 'unit', id: drag.anchorUnitId })
    }
    rememberDragPreview(calculateDragPreview(drag, event.clientX, event.clientY))
  }

  const handleViewportScroll = () => {
    const drag = dragRef.current
    if (!drag?.moved) return
    rememberDragPreview(calculateDragPreview(drag, drag.lastClientX, drag.lastClientY))
  }

  const suppressFollowingClick = () => {
    suppressClickRef.current = true
    if (suppressClickTimerRef.current !== null) {
      window.clearTimeout(suppressClickTimerRef.current)
    }
    suppressClickTimerRef.current = window.setTimeout(() => {
      suppressClickRef.current = false
      suppressClickTimerRef.current = null
    }, 0)
  }

  const finishUnitPointer = (
    event: PointerEvent<HTMLButtonElement>,
    cancelled = false,
  ) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const preview = !cancelled && drag.moved
      ? calculateDragPreview(drag, event.clientX, event.clientY)
      : null
    dragRef.current = null
    rememberDragPreview(null)
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture?.(event.pointerId)
    }
    if (cancelled || !drag.moved) return

    suppressFollowingClick()
    if (!preview?.valid || !preview.delta) {
      onNotify(preview?.message ?? 'Déplacement impossible.')
      return
    }
    if (preview.objectiveTargetId) {
      const anchor = unitById.get(drag.anchorUnitId)
      const objective = unitById.get(preview.objectiveTargetId)
      if (anchor && objective) tryReachObjective(anchor, objective)
      return
    }
    if (!preview.changed) return

    if (drag.unitIds.length === 1) {
      const move = preview.moves[0]
      if (move) onMoveUnit(move.unitId, move.to)
      return
    }
    onMoveUnits(drag.unitIds, preview.delta)
  }

  const handleUnitClick = (event: React.MouseEvent<HTMLButtonElement>, unit: TacticalUnit) => {
    event.stopPropagation()
    if (suppressClickRef.current) {
      suppressClickRef.current = false
      return
    }
    if (tool === 'delete') {
      onDeleteUnit(unit.id)
      return
    }
    if (tool === 'select') {
      if (event.shiftKey) {
        onSelectionChange(toggleUnitSelection(selection, unit.id))
        return
      }
      const selectedUnit = scenario.units.find((candidate) => candidate.id === selectedUnitId)
      if (selectedUnit && selectedUnit.id !== unit.id && tryReachObjective(selectedUnit, unit)) {
        return
      }
      onSelectionChange(
        selectedUnitId === unit.id ? null : { kind: 'unit', id: unit.id },
      )
    }
  }

  const handleCellKeyDown = (event: KeyboardEvent<HTMLButtonElement>, position: Position) => {
    let next: Position | null = null
    if (event.key === 'ArrowRight') next = { ...position, column: Math.min(scenario.grid.columns - 1, position.column + 1) }
    if (event.key === 'ArrowLeft') next = { ...position, column: Math.max(0, position.column - 1) }
    if (event.key === 'ArrowDown') next = { ...position, row: Math.min(scenario.grid.rows - 1, position.row + 1) }
    if (event.key === 'ArrowUp') next = { ...position, row: Math.max(0, position.row - 1) }
    if (!next || samePosition(next, position)) return
    event.preventDefault()
    document.querySelector<HTMLElement>(`[data-cell="${cellKey(next)}"]`)?.focus()
  }

  const previewStart = arrowStart
  const previewEnd = arrowPreview
  const dragDestinationKeys = new Set(
    (unitDragPreview?.moves ?? [])
      .filter((move) => isPositionInGrid(move.to, scenario.grid))
      .map((move) => cellKey(move.to)),
  )
  const dragSourceIds = new Set(unitDragPreview?.unitIds ?? [])
  const draggedUnits = (unitDragPreview?.unitIds ?? []).flatMap((unitId) => {
    const unit = unitById.get(unitId)
    return unit ? [unit] : []
  })
  const cssVariables = {
    '--cell-size': `${Math.round(64 * zoom)}px`,
  } as CSSProperties

  return (
    <div
      ref={viewportRef}
      className={styles.viewport}
      data-tool={tool}
      aria-label="Zone du plateau"
      onScroll={handleViewportScroll}
    >
      <div className={styles.stage}>
        <div
          ref={boardRef}
          className={styles.boardFrame}
          style={cssVariables}
          data-board-export
          data-board-surface="terrain"
          aria-label={`Plateau tactique ${scenario.grid.columns} par ${scenario.grid.rows}`}
        >
          <div
            ref={gridRef}
            className={styles.grid}
            role="grid"
            aria-multiselectable="true"
            aria-label="Cases du plateau"
            style={{
              gridTemplateColumns: `repeat(${scenario.grid.columns}, var(--cell-size))`,
              gridTemplateRows: `repeat(${scenario.grid.rows}, var(--cell-size))`,
            }}
          >
            {positions.map((position) => {
              const unit = unitByCell.get(cellKey(position))
              const coordinate = coordinateLabel(position)
              const target = dragDestinationKeys.has(cellKey(position))
              return (
                <button
                  key={cellKey(position)}
                  type="button"
                  role="gridcell"
                  className={[
                    styles.cell,
                    target ? (unitDragPreview?.valid ? styles.cellTarget : styles.cellBlocked) : '',
                  ].filter(Boolean).join(' ')}
                  data-png-remove-class={
                    target
                      ? unitDragPreview?.valid
                        ? styles.cellTarget
                        : styles.cellBlocked
                      : undefined
                  }
                  data-drag-target={
                    target ? (unitDragPreview?.valid ? 'valid' : 'invalid') : undefined
                  }
                  data-cell={cellKey(position)}
                  data-row={position.row}
                  data-column={position.column}
                  aria-label={`Case ${coordinate}${unit ? `, ${unit.name}` : ', vide'}`}
                  tabIndex={position.row === 0 && position.column === 0 ? 0 : -1}
                  onClick={(event) => handleCellClick(event, position)}
                  onKeyDown={(event) => handleCellKeyDown(event, position)}
                  onPointerDown={(event) => handleCellPointerDown(event, position)}
                  onPointerMove={(event) => handleCellPointerMove(event, position)}
                  onPointerEnter={() => tool === 'arrow' && setArrowPreview(position)}
                  onPointerUp={handleCellPointerUp}
                >
                  {scenario.grid.showCoordinates && <span className={styles.coordinate}>{coordinate}</span>}
                </button>
              )
            })}
          </div>

          <ArrowLayer
            annotations={scenario.annotations.filter(
              (annotation): annotation is ArrowAnnotation => annotation.kind === 'arrow',
            )}
            arrowColor={arrowColor}
            arrowStyle={arrowStyle}
            columns={scenario.grid.columns}
            previewEnd={previewEnd}
            previewStart={previewStart}
            rows={scenario.grid.rows}
            selectedAnnotationId={selectedAnnotationId}
          />

          <div className={styles.unitLayer}>
            <MarkerLayer
              annotations={scenario.annotations.filter(
                (annotation): annotation is MarkerAnnotation => annotation.kind === 'marker',
              )}
              selectedAnnotationId={selectedAnnotationId}
            />

            {scenario.units.map((unit) => {
              const faction = factionById.get(unit.factionId)
              const status = statusDetails(unit.status)
              const assetUrl = unit.icon.kind === 'asset' ? assetUrls[unit.icon.assetId] : undefined
              const selected = selectedUnitIdSet.has(unit.id)
              const dragSource = dragSourceIds.has(unit.id)
              const exportClasses = [
                selected ? styles.unitSelected : '',
                dragSource ? styles.unitDragSource : '',
              ].filter(Boolean).join(' ')
              return (
                <button
                  key={unit.id}
                  aria-pressed={selected}
                  className={`${unitClassName(unit, selected)} ${dragSource ? styles.unitDragSource : ''}`}
                  data-cell={cellKey(unit.position)}
                  data-column={unit.position.column}
                  data-drag-source={dragSource ? 'true' : undefined}
                  data-png-remove-class={exportClasses || undefined}
                  data-row={unit.position.row}
                  type="button"
                  title={unit.name}
                  aria-label={`${unit.name}, faction ${faction?.name ?? 'inconnue'}, ${status?.label ?? 'active'}`}
                  style={{
                    left: `calc(${unit.position.column} * var(--cell-size))`,
                    top: `calc(${unit.position.row} * var(--cell-size))`,
                    '--unit-color': unit.color,
                    '--faction-color': faction?.color ?? '#94a3b8',
                  } as CSSProperties}
                  onClick={(event) => handleUnitClick(event, unit)}
                  onPointerDown={(event) => handleUnitPointerDown(event, unit)}
                  onPointerMove={handleUnitPointerMove}
                  onPointerUp={(event) => finishUnitPointer(event)}
                  onPointerCancel={(event) => finishUnitPointer(event, true)}
                  onLostPointerCapture={(event) => {
                    if (dragRef.current?.pointerId === event.pointerId) {
                      finishUnitPointer(event, true)
                    }
                  }}
                >
                  <UnitVisual assetUrl={assetUrl} faction={faction} unit={unit} />
                </button>
              )
            })}
          </div>

          {unitDragPreview ? (
            <DragGhostLayer
              assetUrls={assetUrls}
              factionById={factionById}
              translateX={unitDragPreview.translateX}
              translateY={unitDragPreview.translateY}
              units={draggedUnits}
              valid={unitDragPreview.valid}
            />
          ) : null}

          {!scenario.units.length && (
            <div className={styles.emptyHint} data-png-hide="true">
              Choisissez une unité, puis touchez une case
            </div>
          )}
        </div>
      </div>
    </div>
  )
})
/**
 * Cette fonction intervient sur le sujet “selection Icon” dans tactical-board.
 *
 * Fichier: src/tactical-board/features/battlefield/Battlefield.tsx
 * Si tu lis ce fichier pour apprendre, regarde d’abord SelectionIcon dans Battlefield.tsx.
 */


export function SelectionIcon({ kind }: { kind: TacticalUnit['status'] }) {
  if (kind === 'neutralized') return <CircleOff aria-hidden />
  if (kind === 'hidden') return <EyeOff aria-hidden />
  if (kind === 'destroyed') return <X aria-hidden />
  return <ShieldAlert aria-hidden />
}
