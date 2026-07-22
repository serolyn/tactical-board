import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  OBJECTIVE_CAMPAIGN_SCENARIO_ID_SETTING,
  OBJECTIVE_CAMPAIGN_VERSION_SETTING,
} from '@/tactical-board/model/objectiveCampaign'
import { OBJECTIVE_CAMPAIGN_VERSION } from '@/tactical-board/model/objectiveCampaignDefinition'
import { createDefaultScenario } from '@/tactical-board/model/scenarioDocument'
import {
  type LegacyScenarioDocumentV1,
  type ScenarioDocumentV1,
} from '@/tactical-board/model/tacticalBoardTypes'
import {
  createScenarioExport,
  importScenario,
  prepareScenarioImport,
  ScenarioImportError,
} from '@/tactical-board/import-export/scenarioExchange'
import type { ImageAssetRecord } from '@/tactical-board/persistence/imageAssetRecord'
import { loadInitialBoardData } from '@/tactical-board/persistence/loadInitialBoardData'
import {
  clearRecoveryJournal,
  readRecoveryJournal,
  RECOVERY_JOURNAL_KEY,
  writeRecoveryJournal,
} from '@/tactical-board/persistence/recoveryJournal'
import { createAutosaveController } from '@/tactical-board/persistence/scenarioAutosave'
import {
  deleteTacticalBoardDatabase,
  openTacticalBoardDatabase,
  StoredScenarioMigrationError,
  TacticalBoardRepository,
} from '@/tactical-board/persistence/tacticalBoardRepository'

const DATE = '2026-01-01T00:00:00.000Z'

function scenario(id: string, updatedAt = DATE, assetId?: string): ScenarioDocumentV1 {
  const source = createDefaultScenario(id, { id, now: updatedAt })
  return assetId
    ? {
        ...source,
        customUnitTypes: [
          {
            id: `type-${id}`,
            name: 'Image',
            category: 'Personnalisé',
            defaultColor: '#ffffff',
            icon: { kind: 'asset', assetId },
            builtin: false,
            archived: false,
          },
        ],
      }
    : source
}

function asset(id: string): ImageAssetRecord {
  return {
    id,
    blob: new Blob(['image'], { type: 'image/png' }),
    mimeType: 'image/png',
    name: `${id}.png`,
    width: 1,
    height: 1,
    createdAt: DATE,
  }
}

function legacyScenario(id = 'legacy'): LegacyScenarioDocumentV1 {
  const current = scenario(id)
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

beforeEach(async () => {
  vi.useRealTimers()
  localStorage.clear()
  await deleteTacticalBoardDatabase()
})

afterEach(async () => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  localStorage.clear()
  await deleteTacticalBoardDatabase()
})

describe('persistance et récupération de Tactical Board', () => {
  it('enregistre scénarios, assets et réglages puis nettoie seulement les orphelins', async () => {
    const repository = new TacticalBoardRepository()
    const older = scenario('older', '2026-01-01T00:00:00.000Z')
    const newer = scenario('newer', '2026-02-01T00:00:00.000Z', 'used')

    await repository.saveScenario(older)
    await repository.saveScenarioWithAssets(newer, [asset('used'), asset('orphan')])
    await repository.saveScenarioWithSettings(newer, {
      activeScenarioId: newer.id,
      customSetting: true,
    })

    expect((await repository.listScenarios()).map((entry) => entry.id)).toEqual([
      'newer',
      'older',
    ])
    await expect(repository.getAsset('used')).resolves.toMatchObject({ id: 'used' })
    await expect(repository.getSetting('activeScenarioId')).resolves.toBe('newer')
    await expect(repository.cleanupOrphanAssets()).resolves.toEqual(['orphan'])
    await expect(repository.getAsset('used')).resolves.toBeDefined()
    await expect(repository.getAsset('orphan')).resolves.toBeUndefined()
  })

  it('migre les documents V1 atomiquement et annule tout devant une version future', async () => {
    const database = await openTacticalBoardDatabase()
    const legacy = { ...legacyScenario(), legacyExtension: { retained: true } }
    await database.put('scenarios', legacy)

    const repository = new TacticalBoardRepository()
    const migrated = await repository.listScenarios()
    expect(migrated[0]).toMatchObject({
      id: 'legacy',
      formatVersion: 2,
      objective: '',
      status: 'active',
      legacyExtension: { retained: true },
    })
    await expect(database.get('scenarios', 'legacy')).resolves.toMatchObject({ formatVersion: 2 })

    await database.put('scenarios', legacy)
    await database.put('scenarios', { ...legacy, id: 'future', formatVersion: 99 } as never)
    await expect(repository.listScenarios()).rejects.toBeInstanceOf(StoredScenarioMigrationError)
    await expect(database.get('scenarios', 'legacy')).resolves.toMatchObject({ formatVersion: 1 })
  })

  it('met à niveau le seed suivi sans changer son ID ni le scénario personnel actif', async () => {
    const repository = new TacticalBoardRepository()
    const campaign = createDefaultScenario('L’objectif', {
      id: 'campaign-stable',
      now: '2026-01-01T00:00:00.000Z',
    })
    const personal = createDefaultScenario('Projet personnel', {
      id: 'personal',
      now: '2026-07-01T00:00:00.000Z',
    })
    await repository.saveScenario(campaign)
    await repository.saveScenario(personal)
    await repository.setSetting('activeScenarioId', personal.id)
    await repository.setSetting(OBJECTIVE_CAMPAIGN_VERSION_SETTING, 2)
    await repository.setSetting(OBJECTIVE_CAMPAIGN_SCENARIO_ID_SETTING, campaign.id)

    const loaded = await loadInitialBoardData()

    expect(loaded.activeScenarioId).toBe(personal.id)
    expect(loaded.documents.map((document) => document.id).sort()).toEqual([
      'campaign-stable',
      'personal',
    ])
    expect(loaded.documents.find((document) => document.id === campaign.id)?.units)
      .toEqual(expect.arrayContaining([expect.objectContaining({ name: 'LIBRE' })]))
    await expect(repository.getScenario(personal.id)).resolves.toEqual(personal)
    await expect(repository.getSetting(OBJECTIVE_CAMPAIGN_VERSION_SETTING))
      .resolves.toBe(OBJECTIVE_CAMPAIGN_VERSION)
  })

  it('regroupe les changements et sérialise une valeur arrivée pendant une écriture', async () => {
    vi.useFakeTimers()
    let releaseFirst: (() => void) | undefined
    let activeWrites = 0
    let maximumActiveWrites = 0
    const values: number[] = []
    const save = vi.fn(async (value: number) => {
      activeWrites += 1
      maximumActiveWrites = Math.max(maximumActiveWrites, activeWrites)
      values.push(value)
      if (value === 2) {
        await new Promise<void>((resolve) => {
          releaseFirst = resolve
        })
      }
      activeWrites -= 1
    })
    const autosave = createAutosaveController(save, 350)

    autosave.schedule(1)
    autosave.schedule(2)
    await vi.advanceTimersByTimeAsync(350)
    await vi.waitFor(() => expect(save).toHaveBeenCalledWith(2))
    autosave.schedule(3)
    releaseFirst?.()
    await autosave.flush()

    expect(values).toEqual([2, 3])
    expect(maximumActiveWrites).toBe(1)
    expect(autosave.getSnapshot().state).toBe('saved')
  })

  it('conserve la valeur après une erreur de quota et permet un nouvel essai', async () => {
    const save = vi
      .fn<(value: string) => Promise<void>>()
      .mockRejectedValueOnce(new Error('Quota dépassé'))
      .mockResolvedValue(undefined)
    const autosave = createAutosaveController(save, 0)

    autosave.schedule('scénario')
    await autosave.flush()
    expect(autosave.getSnapshot()).toMatchObject({ state: 'error' })

    await autosave.retry()
    expect(save).toHaveBeenCalledTimes(2)
    expect(save).toHaveBeenLastCalledWith('scénario')
    expect(autosave.getSnapshot().state).toBe('saved')
  })

  it('relit le journal valide ou V1 et n’efface jamais une modification plus récente', () => {
    const older = { ...scenario('recovery'), name: 'Version 1' }
    const newer = {
      ...older,
      name: 'Version 2',
      updatedAt: '2026-01-01T00:00:02.000Z',
    }

    writeRecoveryJournal(older)
    expect(readRecoveryJournal()).toEqual(older)
    writeRecoveryJournal(newer)
    expect(clearRecoveryJournal(older)).toBe(false)
    expect(readRecoveryJournal()).toEqual(newer)
    expect(clearRecoveryJournal(newer)).toBe(true)

    const legacy = legacyScenario('journal-v1')
    localStorage.setItem(RECOVERY_JOURNAL_KEY, JSON.stringify(legacy))
    expect(readRecoveryJournal()).toMatchObject({
      id: 'journal-v1',
      formatVersion: 2,
      objective: '',
      status: 'active',
    })
    localStorage.setItem(RECOVERY_JOURNAL_KEY, '{invalide')
    expect(readRecoveryJournal()).toBeNull()
  })

  it('remappe un export valide et ne laisse aucune écriture partielle si l’import est invalide', async () => {
    const source = scenario('export-source')
    const exportRepository = new TacticalBoardRepository()
    const bundle = await createScenarioExport(source, exportRepository)
    const prepared = await prepareScenarioImport(bundle)

    expect(prepared.scenario.id).not.toBe(source.id)
    expect(prepared.scenario.factions[0]?.id).not.toBe(source.factions[0]?.id)
    expect(prepared.assets).toEqual([])

    const invalid = structuredClone(bundle) as unknown as Record<string, unknown>
    const invalidScenario = invalid.scenario as Record<string, unknown>
    invalidScenario.grid = { rows: 99, columns: 8, showCoordinates: true }
    const target = new TacticalBoardRepository()

    await expect(importScenario(invalid, { repository: target }))
      .rejects.toBeInstanceOf(ScenarioImportError)
    await expect(target.listScenarios()).resolves.toEqual([])
    await expect(target.listAssets()).resolves.toEqual([])
  })
})
