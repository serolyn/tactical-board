import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it } from 'vitest'
import type { LegacyScenarioDocumentV1, ScenarioDocumentV1 } from '../domain'
import type { ImageAssetRecord } from './imageAssets'
import {
  deleteTacticalBoardDatabase,
  TacticalBoardRepository,
} from './repository'
import {
  createAllScenariosExport,
  createScenarioExport,
  importScenario,
  LEGACY_SCENARIO_EXPORT_VERSION,
  prepareScenarioImport,
  SCENARIO_COLLECTION_EXPORT_KIND,
  SCENARIO_COLLECTION_EXPORT_VERSION,
  SCENARIO_EXPORT_KIND,
  ScenarioImportError,
} from './scenarioExchange'

const DATE = '2026-01-01T00:00:00.000Z'

function imageAsset(id: string): ImageAssetRecord {
  const pngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAF/gL+XQpfWQAAAABJRU5ErkJggg=='
  const binary = atob(pngBase64)
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
  return {
    id,
    blob: new Blob([bytes], { type: 'image/png' }),
    mimeType: 'image/png',
    name: `${id}.png`,
    width: 1,
    height: 1,
    createdAt: DATE,
  }
}

class StaticAssetRepository extends TacticalBoardRepository {
  private readonly records: ReadonlyMap<string, ImageAssetRecord>

  constructor(records: ReadonlyMap<string, ImageAssetRecord>) {
    super()
    this.records = records
  }

  override async getAsset(id: string): Promise<ImageAssetRecord | undefined> {
    return this.records.get(id)
  }
}

function exportRepository(): TacticalBoardRepository {
  return new StaticAssetRepository(
    new Map([
      ['asset-logo', imageAsset('asset-logo')],
      ['asset-unused', imageAsset('asset-unused')],
    ]),
  )
}

function validScenario(): ScenarioDocumentV1 {
  const icon = { kind: 'asset' as const, assetId: 'asset-logo' }
  return {
    formatVersion: 2,
    id: 'scenario-source',
    name: 'Opération Alpha',
    objective: 'Sécuriser le pont',
    period: { start: DATE, target: '2026-09-01T00:00:00.000Z' },
    status: 'active',
    previousScenarioId: 'scenario-previous',
    createdAt: DATE,
    updatedAt: DATE,
    grid: { rows: 8, columns: 8, showCoordinates: true },
    factions: [
      { id: 'faction-blue', name: 'Mes forces', color: '#2563eb', role: 'own' },
      { id: 'faction-red', name: 'Obstacles', color: '#dc2626', role: 'obstacle' },
    ],
    customUnitTypes: [
      {
        id: 'type-drone',
        name: 'Drone',
        category: 'Aérien',
        defaultColor: '#38bdf8',
        icon,
        builtin: false,
        archived: false,
      },
    ],
    units: [
      {
        id: 'unit-one',
        name: 'Éclaireur',
        typeId: 'type-drone',
        typeSnapshot: {
          typeId: 'type-drone',
          name: 'Drone',
          category: 'Aérien',
          defaultColor: '#38bdf8',
          icon,
        },
        factionId: 'faction-blue',
        color: '#38bdf8',
        icon,
        note: 'Surveillance',
        status: 'active',
        position: { row: 1, column: 2 },
      },
    ],
    annotations: [
      {
        id: 'arrow-one',
        kind: 'arrow',
        start: { row: 1, column: 2 },
        end: { row: 5, column: 6 },
        color: '#ef4444',
        style: 'attack',
      },
      {
        id: 'marker-one',
        kind: 'marker',
        position: { row: 4, column: 4 },
        color: '#fbbf24',
        markerType: 'objective',
        label: 'Pont',
      },
    ],
  }
}

function legacyScenario(source = validScenario()): LegacyScenarioDocumentV1 {
  return {
    formatVersion: 1,
    id: source.id,
    name: source.name,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
    grid: source.grid,
    factions: source.factions.map(({ id, name, color }) => ({ id, name, color })),
    customUnitTypes: source.customUnitTypes,
    units: source.units,
    annotations: source.annotations,
  }
}

function mutableCopy(value: unknown): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>
}

describe('échange de scénarios', () => {
  afterEach(async () => {
    await deleteTacticalBoardDatabase()
  })

  it('exporte seulement les images référencées puis remappe chaque identité à l’import', async () => {
    const source = validScenario()
    const bundle = await createScenarioExport(source, exportRepository())
    expect(bundle.assets.map((asset) => asset.id)).toEqual(['asset-logo'])

    const prepared = await prepareScenarioImport(JSON.stringify(bundle))
    const imported = prepared.scenario
    const importedType = imported.customUnitTypes[0]!
    const importedUnit = imported.units[0]!
    const importedIcon = importedType.icon

    expect(imported.id).not.toBe(source.id)
    expect(imported.factions[0]!.id).not.toBe(source.factions[0]!.id)
    expect(importedType.id).not.toBe(source.customUnitTypes[0]!.id)
    expect(importedUnit.id).not.toBe(source.units[0]!.id)
    expect(imported.annotations[0]!.id).not.toBe(source.annotations[0]!.id)
    expect(importedUnit.typeId).toBe(importedType.id)
    expect(importedUnit.typeSnapshot.typeId).toBe(importedType.id)
    expect(importedUnit.factionId).toBe(imported.factions[0]!.id)
    expect(imported.objective).toBe(source.objective)
    expect(imported.period).toEqual(source.period)
    expect(imported.previousScenarioId).toBeUndefined()
    expect(importedIcon.kind).toBe('asset')
    if (importedIcon.kind === 'asset') {
      expect(importedIcon.assetId).toBe(prepared.assets[0]!.id)
      expect(importedIcon.assetId).not.toBe('asset-logo')
    }
  })

  it('refuse une version future, une image manquante et une double occupation', async () => {
    const bundle = await createScenarioExport(validScenario(), exportRepository())

    const future = mutableCopy(bundle)
    future.formatVersion = 3
    await expect(prepareScenarioImport(future)).rejects.toBeInstanceOf(ScenarioImportError)

    const missingAsset = mutableCopy(bundle)
    missingAsset.assets = []
    await expect(prepareScenarioImport(missingAsset)).rejects.toThrow('références invalides')

    const occupied = mutableCopy(bundle)
    const scenario = occupied.scenario as Record<string, unknown>
    const units = scenario.units as Record<string, unknown>[]
    units.push({ ...units[0]!, id: 'unit-two' })
    await expect(prepareScenarioImport(occupied)).rejects.toThrow('références invalides')
  })

  it('n’écrit rien tant que toute la validation n’est pas terminée', async () => {
    const repository = new TacticalBoardRepository()
    const bundle = await createScenarioExport(validScenario(), exportRepository())

    const invalid = mutableCopy(bundle)
    const scenario = invalid.scenario as Record<string, unknown>
    const grid = scenario.grid as Record<string, unknown>
    grid.rows = 99

    await expect(importScenario(invalid, { repository })).rejects.toBeInstanceOf(ScenarioImportError)
    await expect(repository.listScenarios()).resolves.toEqual([])
    await expect(repository.listAssets()).resolves.toEqual([])
  })

  it('résout le nom final avant l’unique transaction scénario/images', async () => {
    const repository = new TacticalBoardRepository()
    const bundle = await createScenarioExport(validScenario(), exportRepository())

    const imported = await importScenario(bundle, {
      repository,
      overrideName: (sourceName) => `${sourceName} (importé)`,
    })

    expect(imported.name).toBe('Opération Alpha (importé)')
    await expect(repository.listScenarios()).resolves.toHaveLength(1)
    await expect(repository.getScenario(imported.id)).resolves.toMatchObject({
      id: imported.id,
      name: 'Opération Alpha (importé)',
    })
    await expect(repository.getScenario('scenario-source')).resolves.toBeUndefined()
    await expect(repository.listAssets()).resolves.toHaveLength(1)
  })

  it('refuse un nom final invalide sans aucune écriture', async () => {
    const repository = new TacticalBoardRepository()
    const bundle = await createScenarioExport(validScenario(), exportRepository())

    await expect(
      importScenario(bundle, { repository, overrideName: '   ' }),
    ).rejects.toBeInstanceOf(ScenarioImportError)
    await expect(repository.listScenarios()).resolves.toEqual([])
    await expect(repository.listAssets()).resolves.toEqual([])
  })

  it('importe un export V1, le migre vers V2 puis remappe ses identifiants', async () => {
    const currentBundle = await createScenarioExport(validScenario(), exportRepository())
    const legacy = legacyScenario()
    const legacyBundle = {
      kind: SCENARIO_EXPORT_KIND,
      formatVersion: LEGACY_SCENARIO_EXPORT_VERSION,
      exportedAt: DATE,
      scenario: legacy,
      assets: currentBundle.assets,
    }

    const prepared = await prepareScenarioImport(legacyBundle)

    expect(prepared.scenario).toMatchObject({
      formatVersion: 2,
      objective: '',
      status: 'active',
      grid: legacy.grid,
      annotations: legacy.annotations.map(({ id: _id, ...annotation }) => annotation),
    })
    expect(prepared.scenario.id).not.toBe(legacy.id)
    expect(prepared.scenario.factions.map((faction) => faction.role)).toEqual([
      'own',
      'obstacle',
      'rally',
      'uncertain',
      'objective',
    ])
    expect(prepared.assets).toHaveLength(1)
  })

  it('exporte toute la bibliothèque en V2 avec seulement les images référencées, dédupliquées', async () => {
    const first = validScenario()
    const second: ScenarioDocumentV1 = {
      ...validScenario(),
      id: 'scenario-second',
      name: 'Opération Bravo',
      previousScenarioId: first.id,
      units: [],
      annotations: [],
    }

    const bundle = await createAllScenariosExport([first, second], exportRepository())

    expect(bundle).toMatchObject({
      kind: SCENARIO_COLLECTION_EXPORT_KIND,
      formatVersion: SCENARIO_COLLECTION_EXPORT_VERSION,
    })
    expect(bundle.scenarios.map((scenario) => scenario.id)).toEqual([
      'scenario-source',
      'scenario-second',
    ])
    expect(bundle.scenarios[1]?.previousScenarioId).toBe(first.id)
    expect(bundle.assets.map((entry) => entry.id)).toEqual(['asset-logo'])
  })

  it('refuse un export global contenant deux scénarios de même identité', async () => {
    const source = validScenario()
    await expect(createAllScenariosExport([source, source], exportRepository())).rejects.toThrow(
      'apparaît plusieurs fois',
    )
  })
})
