/**
 * @packageDocumentation
 * Interface du plateau tactique.
 *
 * Ce fichier gère la grille, les unités, les flèches et les marqueurs. Si tu
 * veux comprendre ce que voit l'utilisateur quand il manipule le plateau, c'est
 * ici qu'il faut commencer.
 */

import { previewMoveUnits } from '@/tactical-board/model/applyScenarioCommand'
import type {
  MoveUnitsPreview,
  Position,
  ScenarioDocumentV1,
  TacticalUnit,
} from '@/tactical-board/model/tacticalBoardTypes'
import { cellKey } from './battlefieldGeometry'

export interface DragPreviewAnchor {
  readonly anchorPosition: Position
  readonly anchorUnitId: string
  readonly clientX: number
  readonly clientY: number
  readonly scrollLeft: number
  readonly scrollTop: number
  readonly unitIds: readonly string[]
}

export interface DragPreviewState {
  readonly unitIds: readonly string[]
  readonly translateX: number
  readonly translateY: number
  readonly delta: Position | null
  readonly moves: MoveUnitsPreview['moves']
  readonly valid: boolean
  readonly changed: boolean
  readonly message?: string
  readonly objectiveTargetId?: string
}

export interface CalculateDragPreviewOptions {
  readonly canReachObjective: (unit: TacticalUnit, target: TacticalUnit) => boolean
  readonly clientX: number
  readonly clientY: number
  readonly currentScrollLeft: number
  readonly currentScrollTop: number
  readonly drag: DragPreviewAnchor
  readonly scenario: ScenarioDocumentV1
  readonly target: Position | null
  readonly unitByCell: ReadonlyMap<string, TacticalUnit>
  readonly unitById: ReadonlyMap<string, TacticalUnit>
}

/**
 * Construit l'aperçu visuel, mais délègue la validité du déplacement au modèle
 * afin que le glisser-déposer respecte exactement les mêmes règles métier.
 */
export function calculateUnitDragPreview({
  canReachObjective,
  clientX,
  clientY,
  currentScrollLeft,
  currentScrollTop,
  drag,
  scenario,
  target,
  unitByCell,
  unitById,
}: CalculateDragPreviewOptions): DragPreviewState {
  const translateX = clientX - drag.clientX + currentScrollLeft - drag.scrollLeft
  const translateY = clientY - drag.clientY + currentScrollTop - drag.scrollTop
  if (!target) {
    return {
      unitIds: drag.unitIds,
      translateX,
      translateY,
      delta: null,
      moves: [],
      valid: false,
      changed: false,
      message: 'Relâchez la sélection à l’intérieur du plateau.',
    }
  }

  const delta = {
    row: target.row - drag.anchorPosition.row,
    column: target.column - drag.anchorPosition.column,
  }
  const anchorUnit = unitById.get(drag.anchorUnitId)
  const occupant = unitByCell.get(cellKey(target))
  if (
    drag.unitIds.length === 1 &&
    anchorUnit &&
    occupant &&
    occupant.id !== anchorUnit.id &&
    canReachObjective(anchorUnit, occupant)
  ) {
    return {
      unitIds: drag.unitIds,
      translateX,
      translateY,
      delta,
      moves: [{ unitId: anchorUnit.id, from: anchorUnit.position, to: target }],
      valid: true,
      changed: true,
      objectiveTargetId: occupant.id,
    }
  }

  const rawMoves = drag.unitIds.flatMap((unitId) => {
    const unit = unitById.get(unitId)
    return unit
      ? [{
          unitId,
          from: unit.position,
          to: {
            row: unit.position.row + delta.row,
            column: unit.position.column + delta.column,
          },
        }]
      : []
  })

  try {
    const preview = previewMoveUnits(scenario, drag.unitIds, delta)
    return {
      unitIds: drag.unitIds,
      translateX,
      translateY,
      delta,
      moves: preview.moves,
      valid: true,
      changed: preview.changed,
    }
  } catch (error) {
    return {
      unitIds: drag.unitIds,
      translateX,
      translateY,
      delta,
      moves: rawMoves,
      valid: false,
      changed: false,
      message: error instanceof Error ? error.message : 'Déplacement impossible.',
    }
  }
}
