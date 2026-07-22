import type {
  BoardAnnotation,
  Faction,
  ScenarioDocumentV1,
  TacticalUnit,
} from './tacticalBoardTypes'

/**
 * Décrit uniquement la sélection éphémère de l’éditeur. Les entités restent
 * stockées dans le scénario : cette valeur ne contient que leurs identifiants.
 */
export type BoardSelection =
  | { kind: 'unit'; id: string }
  | { kind: 'units'; ids: readonly string[] }
  | { kind: 'annotation'; id: string }
  | null

export function selectedUnitIds(selection: BoardSelection): readonly string[] {
  if (selection?.kind === 'unit') return [selection.id]
  if (selection?.kind === 'units') return selection.ids
  return []
}

export function toggleUnitSelection(
  selection: BoardSelection,
  unitId: string,
): BoardSelection {
  const currentIds = selectedUnitIds(selection)
  const nextIds = currentIds.includes(unitId)
    ? currentIds.filter((id) => id !== unitId)
    : [...currentIds, unitId]
  return nextIds.length ? { kind: 'units', ids: nextIds } : null
}

export interface SelectionModel {
  readonly selectedUnit: TacticalUnit | null
  readonly selectedUnits: readonly TacticalUnit[]
  readonly selectedAnnotation: BoardAnnotation | null
  readonly ownFaction: Faction | undefined
  readonly canRallySelectedUnits: boolean
  readonly canNeutralizeSelectedUnits: boolean
}

/**
 * Résout une sélection contre le scénario courant et calcule les actions
 * communes disponibles. Cette fonction est pure et ignore les identifiants
 * devenus obsolètes après une mutation du document.
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
    (unit) => scenario?.factions.find((faction) => faction.id === unit.factionId)?.role,
  )

  return {
    selectedUnit,
    selectedUnits,
    selectedAnnotation,
    ownFaction,
    canRallySelectedUnits: Boolean(
      ownFaction
        && selectedUnits.length >= 2
        && selectedFactionRoles.every((role) => role === 'rally'),
    ),
    canNeutralizeSelectedUnits:
      selectedUnits.length >= 2
      && selectedFactionRoles.every((role) => role === 'obstacle')
      && selectedUnits.every((unit) => unit.status !== 'neutralized'),
  }
}
