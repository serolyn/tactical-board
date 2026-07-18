import { describe, expect, it } from 'vitest'
import { applyCommand, createDefaultScenario, type CustomUnitType } from '../domain'
import { createNextScenario } from './scenarioContinuity'

describe('continuité des scénarios', () => {
  it('crée un plateau vide lié au scénario précédent', () => {
    const source = createDefaultScenario('Étape 1', {
      id: 'step-one',
      period: { start: '2026-07-18', target: '2026-09-01' },
    })
    const next = createNextScenario(source, {
      copyOwnForces: false,
      name: 'Étape 2',
      now: '2026-09-01T00:00:00.000Z',
    })

    expect(next).toMatchObject({
      name: 'Étape 2',
      previousScenarioId: 'step-one',
      period: { start: '2026-09-01', current: '2026-09-01' },
      status: 'active',
    })
    expect(next.units).toEqual([])
    expect(next.annotations).toEqual([])
  })

  it('reprend uniquement Mes forces et les types personnalisés nécessaires', () => {
    const drone: CustomUnitType = {
      id: 'drone',
      name: 'Drone',
      category: 'Personnalisé',
      defaultColor: '#22c55e',
      icon: { kind: 'asset', assetId: 'asset-drone' },
      builtin: false,
      archived: false,
    }
    let source = createDefaultScenario('Étape 1')
    source = applyCommand(source, { type: 'addCustomUnitType', unitType: drone }).document
    source = applyCommand(source, {
      type: 'placeUnit',
      unitId: 'own-unit',
      typeId: 'drone',
      factionId: source.factions.find((faction) => faction.role === 'own')!.id,
      position: { row: 1, column: 1 },
      name: 'Force conservée',
    }).document
    source = applyCommand(source, {
      type: 'placeUnit',
      unitId: 'obstacle-unit',
      typeId: 'obstacle',
      factionId: source.factions.find((faction) => faction.role === 'obstacle')!.id,
      position: { row: 2, column: 2 },
      name: 'Ne doit pas suivre',
    }).document

    const next = createNextScenario(source, {
      copyOwnForces: true,
      name: 'Étape 2',
    })

    expect(next.units.map((unit) => unit.name)).toEqual(['Force conservée'])
    expect(next.units[0]?.factionId).toBe(
      next.factions.find((faction) => faction.role === 'own')?.id,
    )
    expect(next.customUnitTypes).toHaveLength(1)
    expect(next.units[0]?.typeId).toBe(next.customUnitTypes[0]?.id)
    expect(next.units[0]?.typeSnapshot.typeId).toBe(next.customUnitTypes[0]?.id)
    expect(next.customUnitTypes[0]?.icon).toEqual({
      kind: 'asset',
      assetId: 'asset-drone',
    })
  })
})
