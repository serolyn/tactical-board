import {
  CircleOff,
  EyeOff,
  Flag,
  MapPin,
  ShieldAlert,
  TriangleAlert,
  X,
} from 'lucide-react'
import {
  forwardRef,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type RefObject,
} from 'react'
import type {
  ArrowAnnotation,
  BoardAnnotation,
  Faction,
  MarkerAnnotation,
  Position,
  ScenarioDocumentV1,
  TacticalUnit,
  UnitType,
} from '../../domain'
import type { ArrowStyle, BoardTool, MarkerKind } from './BoardToolbar'
import { BuiltinIcon } from './BuiltinIcon'
import styles from './Board.module.css'

export type BoardSelection =
  | { kind: 'unit'; id: string }
  | { kind: 'annotation'; id: string }
  | null

export interface BoardProps {
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
  onReachObjective?: (unitId: string, objectiveUnitId: string) => void
  onDeleteUnit: (unitId: string) => void
  onAddArrow: (start: Position, end: Position, style: ArrowStyle, color: string) => void
  onAddMarker: (position: Position, markerType: MarkerAnnotation['markerType'], color: string) => void
  onDeleteAnnotation: (annotationId: string) => void
  onNotify: (message: string) => void
}

interface DragState {
  unitId: string
  pointerId: number
  clientX: number
  clientY: number
  moved: boolean
}

interface ArrowPointerState {
  start: Position
  clientX: number
  clientY: number
  moved: boolean
}

const samePosition = (left: Position, right: Position) =>
  left.row === right.row && left.column === right.column

const cellKey = (position: Position) => `${position.row}:${position.column}`

function coordinateLabel(position: Position) {
  return `${String.fromCharCode(65 + position.column)}${position.row + 1}`
}

function isPositionInGrid(position: Position, scenario: ScenarioDocumentV1) {
  return (
    position.row >= 0 &&
    position.column >= 0 &&
    position.row < scenario.grid.rows &&
    position.column < scenario.grid.columns
  )
}

function distanceToSegment(point: Position, start: Position, end: Position) {
  const px = point.column + 0.5
  const py = point.row + 0.5
  const x1 = start.column + 0.5
  const y1 = start.row + 0.5
  const x2 = end.column + 0.5
  const y2 = end.row + 0.5
  const dx = x2 - x1
  const dy = y2 - y1
  const lengthSquared = dx * dx + dy * dy
  if (!lengthSquared) return Math.hypot(px - x1, py - y1)
  const factor = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSquared))
  return Math.hypot(px - (x1 + factor * dx), py - (y1 + factor * dy))
}

function getAnnotationAt(
  annotations: readonly BoardAnnotation[],
  position: Position,
): BoardAnnotation | undefined {
  const marker = annotations.find(
    (annotation) => annotation.kind === 'marker' && samePosition(annotation.position, position),
  )
  if (marker) return marker
  return annotations
    .filter((annotation): annotation is ArrowAnnotation => annotation.kind === 'arrow')
    .map((annotation) => ({ annotation, distance: distanceToSegment(position, annotation.start, annotation.end) }))
    .filter(({ distance }) => distance <= 0.42)
    .sort((left, right) => left.distance - right.distance)[0]?.annotation
}

function markerIcon(markerType: MarkerAnnotation['markerType']) {
  if (markerType === 'danger') return TriangleAlert
  if (markerType === 'rally') return MapPin
  return Flag
}

function markerTypeFromToolbar(kind: MarkerKind): MarkerAnnotation['markerType'] {
  if (kind === 'warning') return 'danger'
  if (kind === 'rally-point') return 'rally'
  return 'objective'
}

function statusDetails(status: TacticalUnit['status']) {
  if (status === 'wounded') return { symbol: '+', className: styles.statusWounded, label: 'blessée' }
  if (status === 'neutralized') return { symbol: '−', className: styles.statusNeutralized, label: 'neutralisée' }
  if (status === 'destroyed') return { symbol: '×', className: styles.statusDestroyed, label: 'détruite' }
  if (status === 'hidden') return { symbol: '◌', className: styles.statusHidden, label: 'cachée' }
  return null
}

function unitClassName(unit: TacticalUnit, selected: boolean) {
  return [
    styles.unit,
    selected ? styles.unitSelected : '',
    unit.status === 'neutralized' ? styles.unitNeutralized : '',
    unit.status === 'destroyed' ? styles.unitDestroyed : '',
    unit.status === 'hidden' ? styles.unitHidden : '',
  ]
    .filter(Boolean)
    .join(' ')
}

export const Board = forwardRef<HTMLDivElement, BoardProps>(function Board(
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
    onReachObjective,
    onDeleteUnit,
    onAddArrow,
    onAddMarker,
    onDeleteAnnotation,
    onNotify,
  },
  boardRef,
) {
  const [dragTarget, setDragTarget] = useState<Position | null>(null)
  const [arrowStart, setArrowStart] = useState<Position | null>(null)
  const [arrowPreview, setArrowPreview] = useState<Position | null>(null)
  const dragRef = useRef<DragState | null>(null)
  const arrowPointerRef = useRef<ArrowPointerState | null>(null)
  const suppressClickRef = useRef(false)

  const unitByCell = useMemo(
    () => new Map(scenario.units.map((unit) => [cellKey(unit.position), unit])),
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
    const element = document.elementFromPoint(clientX, clientY)?.closest<HTMLElement>('[data-cell]')
    if (!element) return null
    const row = Number(element.dataset.row)
    const column = Number(element.dataset.column)
    const position = { row, column }
    return Number.isInteger(row) && Number.isInteger(column) && isPositionInGrid(position, scenario)
      ? position
      : null
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

  const handleCellClick = (position: Position) => {
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
      if (!arrowStart) {
        setArrowStart(position)
        setArrowPreview(position)
      } else if (samePosition(arrowStart, position)) {
        setArrowStart(null)
        setArrowPreview(null)
      } else {
        onAddArrow(arrowStart, position, arrowStyle, arrowColor)
        setArrowStart(null)
        setArrowPreview(null)
      }
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

    if (unit) {
      onSelectionChange({ kind: 'unit', id: unit.id })
      return
    }
    if (moveSelectedUnit(position)) return
    const annotation = getAnnotationAt(scenario.annotations, position)
    onSelectionChange(annotation ? { kind: 'annotation', id: annotation.id } : null)
  }

  const handleUnitPointerDown = (event: PointerEvent<HTMLButtonElement>, unit: TacticalUnit) => {
    if (tool !== 'select') return
    dragRef.current = {
      unitId: unit.id,
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      moved: false,
    }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  const handleUnitPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    if (Math.hypot(event.clientX - drag.clientX, event.clientY - drag.clientY) >= 6) drag.moved = true
    if (!drag.moved) return
    setDragTarget(positionFromClientPoint(event.clientX, event.clientY))
  }

  const finishUnitPointer = (event: PointerEvent<HTMLButtonElement>, unit: TacticalUnit) => {
    const drag = dragRef.current
    dragRef.current = null
    setDragTarget(null)
    if (!drag || drag.pointerId !== event.pointerId) return
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture?.(event.pointerId)
    }
    if (drag.moved) {
      suppressClickRef.current = true
      const target = positionFromClientPoint(event.clientX, event.clientY)
      if (!target || samePosition(target, unit.position)) return
      const occupant = unitByCell.get(cellKey(target))
      if (occupant && tryReachObjective(unit, occupant)) return
      if (occupant) {
        onNotify('Déplacement impossible : la case est occupée.')
        return
      }
      onMoveUnit(unit.id, target)
    }
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
      const selectedUnit = scenario.units.find((candidate) => candidate.id === selectedUnitId)
      if (selectedUnit && selectedUnit.id !== unit.id && tryReachObjective(selectedUnit, unit)) {
        return
      }
      onSelectionChange(
        selectedUnitId === unit.id ? null : { kind: 'unit', id: unit.id },
      )
    }
  }

  const handleCellPointerDown = (event: PointerEvent<HTMLButtonElement>, position: Position) => {
    if (tool !== 'arrow') return
    arrowPointerRef.current = {
      start: position,
      clientX: event.clientX,
      clientY: event.clientY,
      moved: false,
    }
  }

  const handleCellPointerMove = (event: PointerEvent<HTMLButtonElement>, position: Position) => {
    if (tool !== 'arrow') return
    setArrowPreview(position)
    const pointer = arrowPointerRef.current
    if (pointer && Math.hypot(event.clientX - pointer.clientX, event.clientY - pointer.clientY) >= 6) {
      pointer.moved = true
      setArrowStart(pointer.start)
    }
  }

  const handleCellPointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    if (tool !== 'arrow') return
    const pointer = arrowPointerRef.current
    arrowPointerRef.current = null
    if (!pointer?.moved) return
    suppressClickRef.current = true
    const end = positionFromClientPoint(event.clientX, event.clientY)
    if (end && !samePosition(pointer.start, end)) {
      onAddArrow(pointer.start, end, arrowStyle, arrowColor)
    }
    setArrowStart(null)
    setArrowPreview(null)
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
  const cssVariables = {
    '--cell-size': `${Math.round(64 * zoom)}px`,
  } as CSSProperties

  return (
    <div ref={viewportRef} className={styles.viewport} data-tool={tool} aria-label="Zone du plateau">
      <div className={styles.stage}>
        <div
          ref={boardRef}
          className={styles.boardFrame}
          style={cssVariables}
          data-board-export
          aria-label={`Plateau tactique ${scenario.grid.columns} par ${scenario.grid.rows}`}
        >
          <div
            className={styles.grid}
            role="grid"
            aria-label="Cases du plateau"
            style={{
              gridTemplateColumns: `repeat(${scenario.grid.columns}, var(--cell-size))`,
              gridTemplateRows: `repeat(${scenario.grid.rows}, var(--cell-size))`,
            }}
          >
            {positions.map((position) => {
              const unit = unitByCell.get(cellKey(position))
              const coordinate = coordinateLabel(position)
              const target = dragTarget && samePosition(dragTarget, position)
              return (
                <button
                  key={cellKey(position)}
                  type="button"
                  role="gridcell"
                  className={[
                    styles.cell,
                    (position.row + position.column) % 2 ? styles.cellDark : styles.cellLight,
                    target ? (unit ? styles.cellBlocked : styles.cellTarget) : '',
                  ].filter(Boolean).join(' ')}
                  data-png-remove-class={target ? (unit ? styles.cellBlocked : styles.cellTarget) : undefined}
                  data-cell={cellKey(position)}
                  data-row={position.row}
                  data-column={position.column}
                  aria-label={`Case ${coordinate}${unit ? `, ${unit.name}` : ', vide'}`}
                  tabIndex={position.row === 0 && position.column === 0 ? 0 : -1}
                  onClick={() => handleCellClick(position)}
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

          <svg
            className={styles.annotationLayer}
            viewBox={`0 0 ${scenario.grid.columns} ${scenario.grid.rows}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              {scenario.annotations
                .filter((annotation): annotation is ArrowAnnotation => annotation.kind === 'arrow')
                .map((annotation) => (
                  <marker
                    key={annotation.id}
                    id={`arrow-${annotation.id}`}
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="4"
                    markerHeight="4"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill={annotation.color} />
                  </marker>
                ))}
              <marker id="preview-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto">
                <path d="M 0 0 L 10 5 L 0 10 z" fill={arrowColor} />
              </marker>
            </defs>
            {scenario.annotations
              .filter((annotation): annotation is ArrowAnnotation => annotation.kind === 'arrow')
              .map((annotation) => (
                <line
                  key={annotation.id}
                  className={styles.arrow}
                  data-png-opacity="0.84"
                  data-png-stroke-width="3.5"
                  x1={annotation.start.column + 0.5}
                  y1={annotation.start.row + 0.5}
                  x2={annotation.end.column + 0.5}
                  y2={annotation.end.row + 0.5}
                  stroke={annotation.color}
                  strokeWidth={selectedAnnotationId === annotation.id ? 5 : 3.5}
                  strokeDasharray={
                    annotation.style === 'attack' ? '9 6' : annotation.style === 'support' ? '3 6' : undefined
                  }
                  markerEnd={`url(#arrow-${annotation.id})`}
                  opacity={selectedAnnotationId === annotation.id ? 1 : 0.84}
                />
              ))}
            {previewStart && previewEnd && !samePosition(previewStart, previewEnd) && (
              <line
                className={`${styles.arrow} ${styles.previewLine}`}
                data-png-hide="true"
                x1={previewStart.column + 0.5}
                y1={previewStart.row + 0.5}
                x2={previewEnd.column + 0.5}
                y2={previewEnd.row + 0.5}
                stroke={arrowColor}
                strokeWidth={3.5}
                strokeDasharray={arrowStyle === 'attack' ? '9 6' : arrowStyle === 'support' ? '3 6' : undefined}
                markerEnd="url(#preview-arrow)"
              />
            )}
          </svg>

          <div className={styles.unitLayer}>
            {scenario.annotations
              .filter((annotation): annotation is MarkerAnnotation => annotation.kind === 'marker')
              .map((annotation) => {
                const MarkerIcon = markerIcon(annotation.markerType)
                return (
                  <span
                    key={annotation.id}
                    aria-label={`${annotation.label || 'Marqueur'}, ${annotation.markerType}`}
                    className={`${styles.marker} ${selectedAnnotationId === annotation.id ? styles.markerSelected : ''}`}
                    data-png-remove-class={selectedAnnotationId === annotation.id ? styles.markerSelected : undefined}
                    style={{
                      left: `calc(${annotation.position.column} * var(--cell-size))`,
                      top: `calc(${annotation.position.row} * var(--cell-size))`,
                      '--marker-color': annotation.color,
                    } as CSSProperties}
                    title={annotation.label || annotation.markerType}
                    role="img"
                  >
                    <MarkerIcon aria-hidden />
                    <span className={styles.markerLabel}>{annotation.label}</span>
                  </span>
                )
              })}

            {scenario.units.map((unit) => {
              const faction = factionById.get(unit.factionId)
              const status = statusDetails(unit.status)
              const assetUrl = unit.icon.kind === 'asset' ? assetUrls[unit.icon.assetId] : undefined
              return (
                <button
                  key={unit.id}
                  className={unitClassName(unit, selectedUnitId === unit.id)}
                  data-cell={cellKey(unit.position)}
                  data-column={unit.position.column}
                  data-png-remove-class={selectedUnitId === unit.id ? styles.unitSelected : undefined}
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
                  onPointerUp={(event) => finishUnitPointer(event, unit)}
                  onPointerCancel={(event) => finishUnitPointer(event, unit)}
                >
                  <span className={styles.iconFrame}>
                    {unit.icon.kind === 'asset' && assetUrl ? (
                      <img className={styles.iconImage} src={assetUrl} alt="" draggable={false} />
                    ) : (
                      <BuiltinIcon
                        iconKey={unit.icon.kind === 'catalog' ? unit.icon.name : 'target'}
                        aria-hidden
                      />
                    )}
                    <span className={styles.factionBadge} aria-hidden>{faction?.name.charAt(0).toUpperCase() ?? '?'}</span>
                    {status && <span className={`${styles.statusBadge} ${status.className}`} aria-hidden>{status.symbol}</span>}
                  </span>
                  <span className={styles.unitLabel}>{unit.name}</span>
                </button>
              )
            })}
          </div>

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

export function SelectionIcon({ kind }: { kind: TacticalUnit['status'] }) {
  if (kind === 'neutralized') return <CircleOff aria-hidden />
  if (kind === 'hidden') return <EyeOff aria-hidden />
  if (kind === 'destroyed') return <X aria-hidden />
  return <ShieldAlert aria-hidden />
}
