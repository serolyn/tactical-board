import { describe, expect, it } from 'vitest'
import { applyCommand, createDefaultScenario, type ScenarioDocumentV1 } from '../domain'
import {
  applyObjectiveCampaign,
  findObjectiveCampaignCandidate,
} from './objectiveCampaign'
import {
  OBJECTIVE_CAMPAIGN_ARROWS,
  OBJECTIVE_CAMPAIGN_NAME,
  OBJECTIVE_CAMPAIGN_OBJECTIVE,
  OBJECTIVE_CAMPAIGN_UNITS,
} from './objectiveCampaignSpec'

function historicalCampaign(id: string): ScenarioDocumentV1 {
  let document = createDefaultScenario(OBJECTIVE_CAMPAIGN_NAME, { id })
  document = { ...document, grid: { ...document.grid, rows: 20, columns: 20 } }
  const ownFaction = document.factions.find((faction) => faction.role === 'own')!.id
  const rallyFaction = document.factions.find((faction) => faction.role === 'rally')!.id
  const objectiveFaction = document.factions.find((faction) => faction.role === 'objective')!.id
  document = applyCommand(document, {
    type: 'placeUnit',
    unitId: 'objective-campaign-v1-unit-walid',
    typeId: 'commander',
    factionId: ownFaction,
    position: { row: 18, column: 1 },
    name: 'Walid',
  }).document
  document = applyCommand(document, {
    type: 'placeUnit',
    unitId: 'objective-campaign-v1-unit-city-lille',
    typeId: 'fortress',
    factionId: rallyFaction,
    position: { row: 13, column: 5 },
    name: 'Lille',
  }).document
  return applyCommand(document, {
    type: 'placeUnit',
    unitId: 'objective-campaign-v1-unit-final-objective',
    typeId: 'objective',
    factionId: objectiveFaction,
    position: { row: 1, column: 18 },
    name: 'Départ en L2 stabilisé — septembre 2026',
  }).document
}

describe('campagne « L’objectif »', () => {
  it('organise la campagne symbolique V3 sur 20×20 avec cinq factions et douze flèches', () => {
    const source = createDefaultScenario('Nouveau scénario', {
      id: 'summer-2026',
      now: '2026-07-18T00:00:00.000Z',
    })
    const campaign = applyObjectiveCampaign(source, '2026-07-18T01:00:00.000Z')

    expect(campaign.name).toBe(OBJECTIVE_CAMPAIGN_NAME)
    expect(campaign.objective).toBe(OBJECTIVE_CAMPAIGN_OBJECTIVE)
    expect(campaign.period).toBeUndefined()
    expect(campaign.grid).toEqual({ rows: 20, columns: 20, showCoordinates: false })
    expect(campaign.factions.map((faction) => faction.role)).toEqual([
      'own',
      'obstacle',
      'rally',
      'uncertain',
      'objective',
    ])
    expect(OBJECTIVE_CAMPAIGN_UNITS).toHaveLength(36)
    expect(OBJECTIVE_CAMPAIGN_ARROWS).toHaveLength(12)
    expect(campaign.units).toHaveLength(OBJECTIVE_CAMPAIGN_UNITS.length)
    expect(campaign.annotations).toHaveLength(OBJECTIVE_CAMPAIGN_ARROWS.length)
    expect(campaign.annotations.every((annotation) => annotation.kind === 'arrow')).toBe(true)
    expect(campaign.units.find((unit) => unit.name === 'LIBRE')?.icon).toEqual({
      kind: 'catalog',
      name: 'warehouse',
    })
    const objectiveFactionId = campaign.factions.find(
      (faction) => faction.role === 'objective',
    )?.id
    expect(
      campaign.units
        .filter(
          (unit) => unit.typeId === 'objective' && unit.factionId === objectiveFactionId,
        )
        .map((unit) => unit.name),
    ).toEqual(['LIBRE'])
    expect(campaign.units.map((unit) => unit.name)).toEqual(
      OBJECTIVE_CAMPAIGN_UNITS.map((unit) => unit.name),
    )
    expect(new Set(campaign.units.map((unit) => `${unit.position.row}:${unit.position.column}`)).size)
      .toBe(campaign.units.length)
  })

  it('remplace précisément le seed V2 tout en conservant son identité et sa continuité', () => {
    const source = createDefaultScenario('L’objectif', {
      id: 'summer-2026-stable',
      now: '2026-01-01T00:00:00.000Z',
      previousScenarioId: 'scenario-precedent',
    })
    const legacySeed = {
      ...source,
      units: [
        {
          id: 'existing-unit',
          name: 'Élément personnel',
          typeId: 'infantry',
          typeSnapshot: {
            typeId: 'infantry',
            name: 'Infanterie',
            category: 'Terrestre',
            defaultColor: '#94a3b8',
            icon: { kind: 'catalog' as const, name: 'shield' },
          },
          factionId: source.factions[0]!.id,
          color: '#94a3b8',
          icon: { kind: 'catalog' as const, name: 'shield' },
          note: '',
          status: 'active' as const,
          position: { row: 18, column: 1 },
        },
      ],
    }
    const migrated = applyObjectiveCampaign(legacySeed, '2026-07-18T01:00:00.000Z')

    expect(migrated.id).toBe('summer-2026-stable')
    expect(migrated.createdAt).toBe(source.createdAt)
    expect(migrated.previousScenarioId).toBe('scenario-precedent')
    expect(migrated.updatedAt).toBe('2026-07-18T01:00:00.000Z')
    expect(migrated.units).toHaveLength(OBJECTIVE_CAMPAIGN_UNITS.length)
    expect(migrated.units.some((unit) => unit.id === 'existing-unit')).toBe(false)
    expect(migrated.annotations).toHaveLength(OBJECTIVE_CAMPAIGN_ARROWS.length)

    const repeated = applyObjectiveCampaign(migrated, '2026-07-18T02:00:00.000Z')
    expect(repeated.id).toBe(migrated.id)
    expect(repeated.units).toEqual(migrated.units)
    expect(repeated.annotations).toEqual(migrated.annotations)
  })

  it('préfère l’identité suivie sans détourner un scénario personnel', () => {
    const older = createDefaultScenario('Ancien', {
      id: 'older',
      now: '2026-01-01T00:00:00.000Z',
    })
    const tracked = createDefaultScenario('Campagne renommée par l’utilisateur', {
      id: 'named',
      now: '2026-02-01T00:00:00.000Z',
    })
    expect(findObjectiveCampaignCandidate([older, tracked], tracked.id)?.id).toBe('named')
    expect(findObjectiveCampaignCandidate([tracked, older].map((document) => ({
      ...document,
      name: document.id,
    })))).toBeUndefined()
  })

  it('refuse une migration historique ambiguë sans identité suivie', () => {
    const first = historicalCampaign('historical-one')
    const second = { ...historicalCampaign('historical-two'), createdAt: first.createdAt }

    expect(findObjectiveCampaignCandidate([first])).toBe(first)
    expect(findObjectiveCampaignCandidate([first, second])).toBeUndefined()
  })
})
