/** Construit les documents par défaut et porte leurs migrations de format durables. */
import {
  LEGACY_SCENARIO_FORMAT_VERSION,
  SCENARIO_FORMAT_VERSION,
  type EntityId,
  type Faction,
  type FactionRole,
  type LegacyScenarioDocumentV1,
  type ScenarioDocumentV2,
  type ScenarioPeriod,
  type ScenarioStatus,
} from './tacticalBoardTypes'

export const DEFAULT_FACTION_IDS = Object.freeze({
  own: 'own-forces',
  obstacle: 'obstacles',
  rally: 'rally',
  uncertain: 'uncertain',
  objective: 'objectives',
} as const)

export interface DefaultScenarioOptions {
  readonly id?: EntityId
  readonly now?: string
  /** @deprecated Utiliser ownForcesFactionId. */
  readonly blueFactionId?: EntityId
  /** @deprecated Utiliser obstacleFactionId. */
  readonly redFactionId?: EntityId
  readonly ownForcesFactionId?: EntityId
  readonly obstacleFactionId?: EntityId
  readonly rallyFactionId?: EntityId
  readonly uncertainFactionId?: EntityId
  readonly objectiveFactionId?: EntityId
  readonly objective?: string
  readonly period?: ScenarioPeriod
  readonly status?: ScenarioStatus
  readonly previousScenarioId?: EntityId
}

export function createEntityId(prefix = 'entity'): EntityId {
  const randomUuid = globalThis.crypto?.randomUUID?.()
  if (randomUuid) return `${prefix}-${randomUuid}`
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

function defaultFactions(options: DefaultScenarioOptions): readonly Faction[] {
  return [
    {
      id: options.ownForcesFactionId ?? options.blueFactionId ?? DEFAULT_FACTION_IDS.own,
      name: 'Mes forces',
      color: '#3b82f6',
      role: 'own',
    },
    {
      id: options.obstacleFactionId ?? options.redFactionId ?? DEFAULT_FACTION_IDS.obstacle,
      name: 'Obstacles',
      color: '#ef4444',
      role: 'obstacle',
    },
    {
      id: options.rallyFactionId ?? DEFAULT_FACTION_IDS.rally,
      name: 'À rallier',
      color: '#f59e0b',
      role: 'rally',
    },
    {
      id: options.uncertainFactionId ?? DEFAULT_FACTION_IDS.uncertain,
      name: 'Incertain ou perdu',
      color: '#64748b',
      role: 'uncertain',
    },
    {
      id: options.objectiveFactionId ?? DEFAULT_FACTION_IDS.objective,
      name: 'Objectifs',
      color: '#eab308',
      role: 'objective',
    },
  ]
}

export function createDefaultScenario(
  name = 'Nouveau scénario',
  options: DefaultScenarioOptions = {},
): ScenarioDocumentV2 {
  const now = options.now ?? new Date().toISOString()
  return {
    formatVersion: SCENARIO_FORMAT_VERSION,
    id: options.id ?? createEntityId('scenario'),
    name,
    objective: options.objective ?? '',
    status: options.status ?? 'active',
    ...(options.period === undefined ? {} : { period: { ...options.period } }),
    ...(options.previousScenarioId === undefined
      ? {}
      : { previousScenarioId: options.previousScenarioId }),
    createdAt: now,
    updatedAt: now,
    grid: {
      rows: 8,
      columns: 8,
      showCoordinates: true,
    },
    factions: defaultFactions(options),
    customUnitTypes: [],
    units: [],
    annotations: [],
  }
}

function normalizeFactionName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('fr')
}

function inferLegacyFactionRole(name: string, index: number): FactionRole {
  const normalizedName = normalizeFactionName(name)
  if (normalizedName === 'bleu' || normalizedName === 'mes forces') return 'own'
  if (normalizedName === 'rouge' || normalizedName === 'obstacles') return 'obstacle'
  if (normalizedName === 'a rallier') return 'rally'
  if (normalizedName === 'incertain ou perdu') return 'uncertain'
  if (normalizedName === 'objectifs') return 'objective'

  // V1 créait Bleu puis Rouge ; l'ordre permet aussi de migrer ces factions renommées.
  if (index === 0) return 'own'
  if (index === 1) return 'obstacle'
  return 'custom'
}

const MIGRATION_FACTION_DEFAULTS: readonly Faction[] = [
  { id: DEFAULT_FACTION_IDS.own, name: 'Mes forces', color: '#3b82f6', role: 'own' },
  { id: DEFAULT_FACTION_IDS.obstacle, name: 'Obstacles', color: '#ef4444', role: 'obstacle' },
  { id: DEFAULT_FACTION_IDS.rally, name: 'À rallier', color: '#f59e0b', role: 'rally' },
  {
    id: DEFAULT_FACTION_IDS.uncertain,
    name: 'Incertain ou perdu',
    color: '#64748b',
    role: 'uncertain',
  },
  { id: DEFAULT_FACTION_IDS.objective, name: 'Objectifs', color: '#eab308', role: 'objective' },
]

/**
 * Migration pure V1 → V2. Les données du plateau et les identifiants sont conservés ;
 * seuls les rôles sémantiques et les nouvelles valeurs par défaut sont ajoutés.
 */
export function migrateScenarioDocumentV1(
  source: LegacyScenarioDocumentV1,
): ScenarioDocumentV2 {
  const factions: Faction[] = source.factions.map((faction, index) => ({
    ...faction,
    role: inferLegacyFactionRole(faction.name, index),
  }))
  const usedIds = new Set(factions.map((faction) => faction.id))
  for (const fallback of MIGRATION_FACTION_DEFAULTS) {
    if (factions.some((faction) => faction.role === fallback.role)) continue
    let id = fallback.id
    let suffix = 2
    while (usedIds.has(id)) {
      id = `${fallback.id}-${suffix}`
      suffix += 1
    }
    usedIds.add(id)
    factions.push({ ...fallback, id })
  }

  return {
    ...source,
    formatVersion: SCENARIO_FORMAT_VERSION,
    objective: '',
    status: 'active',
    factions,
  }
}

export function isLegacyScenarioDocumentV1(value: unknown): value is LegacyScenarioDocumentV1 {
  return (
    typeof value === 'object' &&
    value !== null &&
    'formatVersion' in value &&
    value.formatVersion === LEGACY_SCENARIO_FORMAT_VERSION
  )
}
