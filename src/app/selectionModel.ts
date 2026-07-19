import type {
  BoardAnnotation,
  Faction,
  ScenarioDocumentV1,
  TacticalUnit,
} from '../domain'
import type { BoardSelection } from '../features/board/selection'

export interface SelectionModel {
  readonly selectedUnit: TacticalUnit | null
  readonly selectedUnits: readonly TacticalUnit[]
  readonly selectedAnnotation: BoardAnnotation | null
  readonly ownFaction: Faction | undefined
  readonly canRallySelectedUnits: boolean
  readonly canNeutralizeSelectedUnits: boolean
}

/**
 * Resolves the ephemeral board selection against the current scenario.
 * Missing entity identifiers are deliberately ignored because a selection can
 * briefly outlive the document revision that contained those entities.
 */
export function deriveSelectionModel(
  scenario: ScenarioDocumentV1 | null | undefined,
  selection: BoardSelection,
): SelectionModel {
  const selectedUnit =
    selection?.kind === 'unit'
      ? scenario?.units.find((unit) => unit.id === selection.id) ?? null
      : null

  let selectedUnits: readonly TacticalUnit[] = []
  if (selection?.kind === 'units' && scenario) {
    const unitById = new Map(scenario.units.map((unit) => [unit.id, unit]))
    selectedUnits = selection.ids.flatMap((unitId) => {
      const unit = unitById.get(unitId)
      return unit ? [unit] : []
    })
  }

  const selectedAnnotation =
    selection?.kind === 'annotation'
      ? scenario?.annotations.find((annotation) => annotation.id === selection.id) ?? null
      : null

  const ownFaction = scenario?.factions.find((faction) => faction.role === 'own')
  const selectedFactionRoles = selectedUnits.map(
    (unit) =>
      scenario?.factions.find((faction) => faction.id === unit.factionId)?.role,
  )

  return {
    selectedUnit,
    selectedUnits,
    selectedAnnotation,
    ownFaction,
    canRallySelectedUnits: Boolean(
      ownFaction &&
        selectedUnits.length >= 2 &&
        selectedFactionRoles.every((role) => role === 'rally'),
    ),
    canNeutralizeSelectedUnits:
      selectedUnits.length >= 2 &&
      selectedFactionRoles.every((role) => role === 'obstacle') &&
      selectedUnits.every((unit) => unit.status !== 'neutralized'),
  }
}
