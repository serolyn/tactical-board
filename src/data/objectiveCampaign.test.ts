import { describe, expect, it } from 'vitest'
import { createDefaultScenario } from '../domain'
import {
  applyObjectiveCampaign,
  findObjectiveCampaignCandidate,
} from './objectiveCampaign'
import {
  OBJECTIVE_CAMPAIGN_ARROWS,
  OBJECTIVE_CAMPAIGN_NAME,
  OBJECTIVE_CAMPAIGN_UNITS,
} from './objectiveCampaignSpec'

describe('campagne « L’objectif »', () => {
  it('organise le scénario existant sur 20×20 avec les cinq factions et la continuité demandée', () => {
    const source = createDefaultScenario('Nouveau scénario', {
      id: 'summer-2026',
      now: '2026-07-18T00:00:00.000Z',
    })
    const campaign = applyObjectiveCampaign(source, '2026-07-18T01:00:00.000Z')

    expect(campaign.name).toBe(OBJECTIVE_CAMPAIGN_NAME)
    expect(campaign.objective).toContain('Commencer la L2')
    expect(campaign.period).toEqual({
      start: '2026-07-18',
      current: '2026-07-18',
      target: '2026-09-01',
    })
    expect(campaign.grid).toMatchObject({ rows: 20, columns: 20 })
    expect(campaign.factions.map((faction) => faction.role)).toEqual([
      'own',
      'obstacle',
      'rally',
      'uncertain',
      'objective',
    ])
    expect(campaign.units).toHaveLength(OBJECTIVE_CAMPAIGN_UNITS.length)
    expect(campaign.annotations).toHaveLength(OBJECTIVE_CAMPAIGN_ARROWS.length + 1)
    expect(campaign.annotations).toContainEqual(
      expect.objectContaining({
        kind: 'marker',
        label: 'Route prioritaire conditionnelle',
      }),
    )
    expect(new Set(campaign.units.map((unit) => `${unit.position.row}:${unit.position.column}`)).size)
      .toBe(campaign.units.length)
  })

  it('est idempotente et conserve le contenu préexistant', () => {
    const source = createDefaultScenario('Nouveau scénario', { id: 'summer-2026' })
    const existing = {
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
    const once = applyObjectiveCampaign(existing, '2026-07-18T01:00:00.000Z')
    const twice = applyObjectiveCampaign(once, '2026-07-18T02:00:00.000Z')

    expect(twice.units.filter((unit) => unit.id === 'existing-unit')).toHaveLength(1)
    expect(twice.units).toHaveLength(once.units.length)
    expect(twice.annotations).toHaveLength(once.annotations.length)
  })

  it('préfère le scénario déjà nommé sans détourner un scénario personnel', () => {
    const older = createDefaultScenario('Ancien', {
      id: 'older',
      now: '2026-01-01T00:00:00.000Z',
    })
    const named = createDefaultScenario(OBJECTIVE_CAMPAIGN_NAME, {
      id: 'named',
      now: '2026-02-01T00:00:00.000Z',
    })
    expect(findObjectiveCampaignCandidate([older, named])?.id).toBe('named')
    expect(findObjectiveCampaignCandidate([named, older].map((document) => ({
      ...document,
      name: document.id,
    })))).toBeUndefined()
  })
})
