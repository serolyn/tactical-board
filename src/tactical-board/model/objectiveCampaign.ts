/**
 * @packageDocumentation
 * Modèle métier pur de Tactical Board.
 *
 * Ce dossier décrit les règles du jeu de données: documents, sélection,
 * historique, unités, campagnes et migrations. Il ne dépend pas de React.
 */

/** Matérialise la campagne prédéfinie à partir de sa définition déclarative. */
import { BUILT_IN_UNIT_TYPE_BY_ID } from './unitCatalog'
import { createDefaultScenario } from './scenarioDocument'
import type {
  ArrowAnnotation,
  IconRef,
  Position,
  ScenarioDocumentV2,
  TacticalUnit,
} from './tacticalBoardTypes'
import {
  OBJECTIVE_CAMPAIGN_ARROWS,
  OBJECTIVE_CAMPAIGN_NAME,
  OBJECTIVE_CAMPAIGN_OBJECTIVE,
  OBJECTIVE_CAMPAIGN_UNITS,
} from './objectiveCampaignDefinition'

const GRID_SIZE = 20
const CAMPAIGN_ID_PREFIX = 'objective-campaign-v1'
const LEGACY_CAMPAIGN_SIGNATURE_IDS = [
  `${CAMPAIGN_ID_PREFIX}-unit-walid`,
  `${CAMPAIGN_ID_PREFIX}-unit-city-lille`,
  `${CAMPAIGN_ID_PREFIX}-unit-final-objective`,
  `${CAMPAIGN_ID_PREFIX}-marker-lille-priority`,
] as const

export const OBJECTIVE_CAMPAIGN_VERSION_SETTING = 'objectiveCampaignVersion'
export const OBJECTIVE_CAMPAIGN_SCENARIO_ID_SETTING = 'objectiveCampaignScenarioId'
/**
 * Cette fonction intervient sur le sujet “cell Key” dans tactical-board.
 *
 * Fichier: src/tactical-board/model/objectiveCampaign.ts
 * Si tu lis ce fichier pour apprendre, regarde d’abord cellKey dans objectiveCampaign.ts.
 */


function cellKey(position: Position) {
  return `${position.row}:${position.column}`
}
/**
 * Cette fonction nettoie le sujet “name” dans tactical-board.
 *
 * Fichier: src/tactical-board/model/objectiveCampaign.ts
 * Si tu lis ce fichier pour apprendre, regarde d’abord normalizeName dans objectiveCampaign.ts.
 */


function normalizeName(name: string) {
  return name.trim().toLocaleLowerCase('fr')
}
/**
 * Cette fonction intervient sur le sujet “find Free Position” dans tactical-board.
 *
 * Fichier: src/tactical-board/model/objectiveCampaign.ts
 * Si tu lis ce fichier pour apprendre, regarde d’abord findFreePosition dans objectiveCampaign.ts.
 */


function findFreePosition(preferred: Position, occupied: ReadonlySet<string>): Position {
  if (!occupied.has(cellKey(preferred))) return preferred
  for (let radius = 1; radius < GRID_SIZE; radius += 1) {
    for (let rowOffset = -radius; rowOffset <= radius; rowOffset += 1) {
      for (const columnOffset of [-radius, radius]) {
        const candidate = {
          row: preferred.row + rowOffset,
          column: preferred.column + columnOffset,
        }
        if (
          candidate.row >= 0 &&
          candidate.row < GRID_SIZE &&
          candidate.column >= 0 &&
          candidate.column < GRID_SIZE &&
          !occupied.has(cellKey(candidate))
        ) return candidate
      }
    }
    for (let columnOffset = -radius + 1; columnOffset < radius; columnOffset += 1) {
      for (const rowOffset of [-radius, radius]) {
        const candidate = {
          row: preferred.row + rowOffset,
          column: preferred.column + columnOffset,
        }
        if (
          candidate.row >= 0 &&
          candidate.row < GRID_SIZE &&
          candidate.column >= 0 &&
          candidate.column < GRID_SIZE &&
          !occupied.has(cellKey(candidate))
        ) return candidate
      }
    }
  }
  throw new Error('Le plateau de campagne ne contient plus de case libre.')
}
/**
 * Cette fonction construit le sujet “campaign Unit” dans tactical-board.
 *
 * Fichier: src/tactical-board/model/objectiveCampaign.ts
 * Si tu lis ce fichier pour apprendre, regarde d’abord createCampaignUnit dans objectiveCampaign.ts.
 */


function createCampaignUnit(
  key: string,
  name: string,
  typeId: string,
  factionId: string,
  position: Position,
  status: TacticalUnit['status'],
  iconName?: string,
): TacticalUnit {
  const unitType = BUILT_IN_UNIT_TYPE_BY_ID.get(typeId)
  if (!unitType) throw new Error(`Le type intégré « ${typeId} » est introuvable.`)
  const icon: IconRef = iconName
    ? { kind: 'catalog', name: iconName }
    : { ...unitType.icon }
  return {
    id: `${CAMPAIGN_ID_PREFIX}-unit-${key}`,
    name,
    typeId,
    typeSnapshot: {
      typeId,
      name: unitType.name,
      category: unitType.category,
      defaultColor: unitType.defaultColor,
      icon: { ...icon },
    },
    factionId,
    color: unitType.defaultColor,
    icon,
    note: '',
    status,
    position,
  }
}

/**
 * Reconstruit seulement la campagne prédéfinie. L'identité durable du scénario et ses types
 * personnalisés compatibles sont préservés ; les données initiales suivent la définition courante.
 */
export function applyObjectiveCampaign(
  source: ScenarioDocumentV2,
  now = new Date().toISOString(),
): ScenarioDocumentV2 {
  const template = createDefaultScenario(OBJECTIVE_CAMPAIGN_NAME, {
    id: source.id,
    now,
    objective: OBJECTIVE_CAMPAIGN_OBJECTIVE,
    status: 'active',
    ...(source.previousScenarioId === undefined
      ? {}
      : { previousScenarioId: source.previousScenarioId }),
  })
  const factions = template.factions
  const factionByRole = new Map(factions.map((faction) => [faction.role, faction]))
  const occupied = new Set<string>()
  const unitByCampaignKey = new Map<string, TacticalUnit>()
  const units: TacticalUnit[] = []

  for (const specification of OBJECTIVE_CAMPAIGN_UNITS) {
    const faction = factionByRole.get(specification.factionRole)
    if (!faction) throw new Error(`La faction de campagne « ${specification.factionRole} » manque.`)
    const position = findFreePosition(
      { row: specification.row, column: specification.column },
      occupied,
    )
    const unit = createCampaignUnit(
      specification.key,
      specification.name,
      specification.typeId,
      faction.id,
      position,
      specification.status ?? 'active',
      specification.iconName,
    )
    occupied.add(cellKey(position))
    unitByCampaignKey.set(specification.key, unit)
    units.push(unit)
  }

  const annotations: ArrowAnnotation[] = []
  for (const specification of OBJECTIVE_CAMPAIGN_ARROWS) {
    const id = `${CAMPAIGN_ID_PREFIX}-arrow-${specification.key}`
    const from = unitByCampaignKey.get(specification.from)
    const to = unitByCampaignKey.get(specification.to)
    if (!from || !to) continue
    const annotation: ArrowAnnotation = {
      id,
      kind: 'arrow',
      start: { ...from.position },
      end: { ...to.position },
      style: specification.style,
      color: specification.color,
    }
    annotations.push(annotation)
  }

  const customUnitTypes = source.customUnitTypes
    .filter((unitType) => !BUILT_IN_UNIT_TYPE_BY_ID.has(unitType.id))
    .map((unitType) => structuredClone(unitType))

  return {
    ...template,
    createdAt: source.createdAt,
    updatedAt: now,
    grid: {
      ...template.grid,
      rows: GRID_SIZE,
      columns: GRID_SIZE,
      showCoordinates: false,
    },
    factions,
    customUnitTypes,
    units,
    annotations,
  }
}
/**
 * Cette fonction détecte le sujet “historical Campaign Signature” dans tactical-board.
 *
 * Fichier: src/tactical-board/model/objectiveCampaign.ts
 * Si tu lis ce fichier pour apprendre, regarde d’abord hasHistoricalCampaignSignature dans objectiveCampaign.ts.
 */


function hasHistoricalCampaignSignature(document: ScenarioDocumentV2): boolean {
  const entityIds = new Set([
    ...document.units.map((unit) => unit.id),
    ...document.annotations.map((annotation) => annotation.id),
  ])
  return LEGACY_CAMPAIGN_SIGNATURE_IDS.filter((id) => entityIds.has(id)).length >= 3
}
/**
 * Cette fonction intervient sur le sujet “find Objective Campaign Candidate” dans tactical-board.
 *
 * Fichier: src/tactical-board/model/objectiveCampaign.ts
 * Si tu lis ce fichier pour apprendre, regarde d’abord findObjectiveCampaignCandidate dans objectiveCampaign.ts.
 */


export function findObjectiveCampaignCandidate(
  documents: readonly ScenarioDocumentV2[],
  trackedScenarioId?: string,
): ScenarioDocumentV2 | undefined {
  if (trackedScenarioId !== undefined) {
    return documents.find((document) => document.id === trackedScenarioId)
  }
  const objectiveName = normalizeName(OBJECTIVE_CAMPAIGN_NAME)
  const historicalCandidates = documents.filter(
    (document) =>
      normalizeName(document.name) === objectiveName &&
      hasHistoricalCampaignSignature(document),
  )
  return historicalCandidates.length === 1 ? historicalCandidates[0] : undefined
}
