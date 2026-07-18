import {
  BUILT_IN_UNIT_TYPE_BY_ID,
  createDefaultScenario,
  createEntityId,
  type ArrowAnnotation,
  type Faction,
  type FactionRole,
  type Position,
  type ScenarioDocumentV2,
  type TacticalUnit,
} from '../domain'
import {
  OBJECTIVE_CAMPAIGN_ARROWS,
  OBJECTIVE_CAMPAIGN_NAME,
  OBJECTIVE_CAMPAIGN_OBJECTIVE,
  OBJECTIVE_CAMPAIGN_PERIOD,
  OBJECTIVE_CAMPAIGN_UNITS,
} from './objectiveCampaignSpec'

const GRID_SIZE = 20
const CAMPAIGN_ID_PREFIX = 'objective-campaign-v1'

const roleOrder: readonly Exclude<FactionRole, 'custom'>[] = [
  'own',
  'obstacle',
  'rally',
  'uncertain',
  'objective',
]

function cellKey(position: Position) {
  return `${position.row}:${position.column}`
}

function normalizeName(name: string) {
  return name.trim().toLocaleLowerCase('fr')
}

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

function campaignFactionDefaults(): ReadonlyMap<FactionRole, Faction> {
  return new Map(createDefaultScenario().factions.map((faction) => [faction.role, faction]))
}

function ensureCampaignFactions(source: ScenarioDocumentV2): readonly Faction[] {
  const defaults = campaignFactionDefaults()
  const usedIds = new Set(source.factions.map((faction) => faction.id))
  const factions = source.factions.map((faction) => {
    if (faction.role === 'own' && normalizeName(faction.name) === 'bleu') {
      return { ...faction, name: 'Mes forces' }
    }
    if (faction.role === 'obstacle' && normalizeName(faction.name) === 'rouge') {
      return { ...faction, name: 'Obstacles' }
    }
    return faction
  })

  for (const role of roleOrder) {
    if (factions.some((faction) => faction.role === role)) continue
    const fallback = defaults.get(role)
    if (!fallback) continue
    let id = fallback.id
    if (usedIds.has(id)) id = createEntityId(`faction-${role}`)
    usedIds.add(id)
    factions.push({ ...fallback, id })
  }
  return factions
}

function createCampaignUnit(
  key: string,
  name: string,
  typeId: string,
  factionId: string,
  position: Position,
  status: TacticalUnit['status'],
): TacticalUnit {
  const unitType = BUILT_IN_UNIT_TYPE_BY_ID.get(typeId)
  if (!unitType) throw new Error(`Le type intégré « ${typeId} » est introuvable.`)
  const icon = { ...unitType.icon }
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
 * Builds the requested summer-2026 campaign without replacing pre-existing board data.
 * Stable campaign identifiers make the operation idempotent; the caller still records a
 * setting after the first successful write so user deletions are respected afterwards.
 */
export function applyObjectiveCampaign(
  source: ScenarioDocumentV2,
  now = new Date().toISOString(),
): ScenarioDocumentV2 {
  const factions = ensureCampaignFactions(source)
  const factionByRole = new Map(factions.map((faction) => [faction.role, faction]))
  const occupied = new Set(source.units.map((unit) => cellKey(unit.position)))
  const adoptedUnitIds = new Set<string>()
  const unitByCampaignKey = new Map<string, TacticalUnit>()
  const units = [...source.units]

  for (const specification of OBJECTIVE_CAMPAIGN_UNITS) {
    const stableId = `${CAMPAIGN_ID_PREFIX}-unit-${specification.key}`
    const existing =
      units.find((unit) => unit.id === stableId) ??
      units.find(
        (unit) =>
          !adoptedUnitIds.has(unit.id) &&
          normalizeName(unit.name) === normalizeName(specification.name),
      )
    if (existing) {
      adoptedUnitIds.add(existing.id)
      unitByCampaignKey.set(specification.key, existing)
      continue
    }

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
    )
    occupied.add(cellKey(position))
    adoptedUnitIds.add(unit.id)
    unitByCampaignKey.set(specification.key, unit)
    units.push(unit)
  }

  const annotations = [...source.annotations]
  for (const specification of OBJECTIVE_CAMPAIGN_ARROWS) {
    const id = `${CAMPAIGN_ID_PREFIX}-arrow-${specification.key}`
    if (annotations.some((annotation) => annotation.id === id)) continue
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

  const priorityMarkerId = `${CAMPAIGN_ID_PREFIX}-marker-lille-priority`
  const lille = unitByCampaignKey.get('city-lille')
  if (lille && !annotations.some((annotation) => annotation.id === priorityMarkerId)) {
    annotations.push({
      id: priorityMarkerId,
      kind: 'marker',
      position: { ...lille.position },
      markerType: 'rally',
      color: '#f59e0b',
      label: 'Route prioritaire conditionnelle',
    })
  }

  return {
    ...source,
    name: OBJECTIVE_CAMPAIGN_NAME,
    objective: OBJECTIVE_CAMPAIGN_OBJECTIVE,
    period: { ...OBJECTIVE_CAMPAIGN_PERIOD },
    status: 'active',
    updatedAt: now,
    grid: { ...source.grid, rows: GRID_SIZE, columns: GRID_SIZE },
    factions,
    units,
    annotations,
  }
}

export function findObjectiveCampaignCandidate(
  documents: readonly ScenarioDocumentV2[],
): ScenarioDocumentV2 | undefined {
  const objectiveName = normalizeName(OBJECTIVE_CAMPAIGN_NAME)
  return (
    documents.find((document) => normalizeName(document.name) === objectiveName) ??
    documents.find((document) => normalizeName(document.name) === 'nouveau scénario')
  )
}
