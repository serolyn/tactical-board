import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it } from 'vitest'
import {
  createDefaultScenario,
  type LegacyScenarioDocumentV1,
  type ScenarioDocumentV1,
} from '../domain'
import type { ImageAssetRecord } from './imageAssets'
import {
  deleteTacticalBoardDatabase,
  openTacticalBoardDatabase,
  StoredScenarioMigrationError,
  TacticalBoardRepository,
} from './repository'

function scenario(id: string, updatedAt: string, assetId?: string): ScenarioDocumentV1 {
  const base = createDefaultScenario(id, { id, now: updatedAt })
  const customUnitTypes = assetId
    ? [{
        id: `type-${id}`,
        name: 'Image',
        category: 'Personnalisé',
        defaultColor: '#ffffff',
        icon: { kind: 'asset' as const, assetId },
        builtin: false as const,
        archived: false,
      }]
    : []
  return {
    ...base,
    updatedAt,
    customUnitTypes,
  }
}

function legacyScenario(id: string, updatedAt: string): LegacyScenarioDocumentV1 {
  const current = scenario(id, updatedAt)
  return {
    formatVersion: 1,
    id: current.id,
    name: current.name,
    createdAt: current.createdAt,
    updatedAt: current.updatedAt,
    grid: current.grid,
    factions: current.factions.map(({ id: factionId, name, color }) => ({
      id: factionId,
      name,
      color,
    })),
    customUnitTypes: current.customUnitTypes,
    units: current.units,
    annotations: current.annotations,
  }
}

function asset(id: string): ImageAssetRecord {
  return {
    id,
    blob: new Blob(['image'], { type: 'image/png' }),
    mimeType: 'image/png',
    name: `${id}.png`,
    width: 1,
    height: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
  }
}

describe('TacticalBoardRepository', () => {
  afterEach(async () => {
    await deleteTacticalBoardDatabase()
  })

  it('enregistre et classe les scénarios les plus récents en premier', async () => {
    const repository = new TacticalBoardRepository()
    await repository.saveScenario(scenario('ancien', '2026-01-01T00:00:00.000Z'))
    await repository.saveScenario(scenario('recent', '2026-02-01T00:00:00.000Z'))

    expect((await repository.listScenarios()).map((entry) => entry.id)).toEqual([
      'recent',
      'ancien',
    ])
  })

  it('écrit atomiquement un scénario et ses images', async () => {
    const repository = new TacticalBoardRepository()
    await repository.saveScenarioWithAssets(
      scenario('alpha', '2026-01-01T00:00:00.000Z', 'logo'),
      [asset('logo')],
    )

    await expect(repository.getScenario('alpha')).resolves.toMatchObject({ id: 'alpha' })
    await expect(repository.getAsset('logo')).resolves.toMatchObject({ id: 'logo' })
  })

  it('supprime uniquement les images orphelines', async () => {
    const repository = new TacticalBoardRepository()
    await repository.saveScenarioWithAssets(
      scenario('alpha', '2026-01-01T00:00:00.000Z', 'utilise'),
      [asset('utilise'), asset('orpheline')],
    )

    await expect(repository.cleanupOrphanAssets()).resolves.toEqual(['orpheline'])
    await expect(repository.getAsset('utilise')).resolves.toBeDefined()
    await expect(repository.getAsset('orpheline')).resolves.toBeUndefined()
  })

  it('conserve les réglages indépendamment des scénarios', async () => {
    const repository = new TacticalBoardRepository()
    await repository.setSetting('activeScenarioId', 'alpha')
    await expect(repository.getSetting('activeScenarioId')).resolves.toBe('alpha')
  })

  it('migre atomiquement les documents V1 lors du chargement sans perdre le plateau', async () => {
    const database = await openTacticalBoardDatabase()
    const legacy = legacyScenario('legacy', '2026-03-01T00:00:00.000Z')
    const storedLegacy = { ...legacy, legacyExtension: { retained: true } }
    await database.put('scenarios', storedLegacy)

    const repository = new TacticalBoardRepository()
    const [loaded] = await repository.listScenarios()

    expect(loaded).toMatchObject({
      id: 'legacy',
      formatVersion: 2,
      objective: '',
      status: 'active',
      grid: legacy.grid,
      units: legacy.units,
      annotations: legacy.annotations,
      legacyExtension: { retained: true },
    })
    expect(loaded?.factions.map((faction) => faction.role)).toEqual([
      'own',
      'obstacle',
      'rally',
      'uncertain',
      'objective',
    ])
    await expect(database.get('scenarios', 'legacy')).resolves.toMatchObject({
      formatVersion: 2,
      objective: '',
    })
  })

  it('n’écrit aucune migration si un document de la même transaction est incompatible', async () => {
    const database = await openTacticalBoardDatabase()
    const legacy = legacyScenario('legacy', '2026-03-01T00:00:00.000Z')
    await database.put('scenarios', legacy)
    await database.put('scenarios', {
      ...legacy,
      id: 'future',
      formatVersion: 99,
    } as never)

    const repository = new TacticalBoardRepository()
    await expect(repository.listScenarios()).rejects.toBeInstanceOf(StoredScenarioMigrationError)
    await expect(database.get('scenarios', 'legacy')).resolves.toMatchObject({ formatVersion: 1 })
  })
})
