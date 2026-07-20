/**
 * @packageDocumentation
 * Modèle métier pur de Tactical Board.
 *
 * Ce dossier décrit les règles du jeu de données: documents, sélection,
 * historique, unités, campagnes et migrations. Il ne dépend pas de React.
 */

/** Produit le scénario suivant en copiant uniquement les forces choisies par l'utilisateur. */
import { BUILT_IN_UNIT_TYPE_BY_ID } from './unitCatalog'
import { createDefaultScenario, createEntityId } from './scenarioDocument'
import type { CustomUnitType, ScenarioDocumentV2 } from './tacticalBoardTypes'

export interface CreateNextScenarioOptions {
  copyOwnForces: boolean
  name: string
  now?: string
}
/**
 * Cette fonction construit le sujet “next Scenario” dans tactical-board.
 *
 * Fichier: src/tactical-board/model/scenarioContinuity.ts
 * Si tu lis ce fichier pour apprendre, regarde d’abord createNextScenario dans scenarioContinuity.ts.
 */


export function createNextScenario(
  source: ScenarioDocumentV2,
  options: CreateNextScenarioOptions,
): ScenarioDocumentV2 {
  const now = options.now ?? new Date().toISOString()
  const start = source.period?.target ?? source.period?.current
  const next = createDefaultScenario(options.name, {
    now,
    previousScenarioId: source.id,
    ...(start ? { period: { start, current: start } } : {}),
  })
  const base = {
    ...next,
    grid: { ...source.grid },
  }
  if (!options.copyOwnForces) return base

  const ownFaction = source.factions.find((faction) => faction.role === 'own')
  const nextOwnFaction = base.factions.find((faction) => faction.role === 'own')
  if (!ownFaction || !nextOwnFaction) return base

  const sourceUnits = source.units.filter((unit) => unit.factionId === ownFaction.id)
  const referencedCustomTypeIds = new Set(
    sourceUnits
      .map((unit) => unit.typeId)
      .filter((typeId) => !BUILT_IN_UNIT_TYPE_BY_ID.has(typeId)),
  )
  const typeIdMap = new Map<string, string>()
  const customUnitTypes: CustomUnitType[] = source.customUnitTypes
    .filter((unitType) => referencedCustomTypeIds.has(unitType.id))
    .map((unitType) => {
      const id = createEntityId('type')
      typeIdMap.set(unitType.id, id)
      return { ...structuredClone(unitType), id }
    })

  return {
    ...base,
    customUnitTypes,
    units: sourceUnits.map((unit) => {
      const typeId = typeIdMap.get(unit.typeId) ?? unit.typeId
      return {
        ...structuredClone(unit),
        id: createEntityId('unit'),
        factionId: nextOwnFaction.id,
        typeId,
        typeSnapshot: { ...structuredClone(unit.typeSnapshot), typeId },
      }
    }),
  }
}
