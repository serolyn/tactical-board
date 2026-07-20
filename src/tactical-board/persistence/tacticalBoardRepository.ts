/** Isole toutes les transactions IndexedDB et les migrations de données Tactical Board. */
/**
 * @packageDocumentation
 * Couche d'accès à IndexedDB pour Tactical Board.
 *
 * Ce module expose les opérations persistantes (documents, assets, settings),
 * garantit les migrations à la lecture et encapsule les transactions IDB.
 */
import { deleteDB, openDB, type DBSchema, type IDBPDatabase } from 'idb'
import {
  isLegacyScenarioDocumentV1,
  migrateScenarioDocumentV1,
} from '@/tactical-board/model/scenarioDocument'
import {
  SCENARIO_FORMAT_VERSION,
  type LegacyScenarioDocumentV1,
  type ScenarioDocumentV1,
} from '@/tactical-board/model/tacticalBoardTypes'
import type { ImageAssetRecord } from './imageAssetRecord'

const DATABASE_NAME = 'tactical-board'
const DATABASE_VERSION = 1

interface SettingRecord {
  key: string
  value: unknown
}

type StoredScenarioDocument = ScenarioDocumentV1 | LegacyScenarioDocumentV1

interface TacticalBoardSchema extends DBSchema {
  scenarios: {
    key: string
    value: StoredScenarioDocument
    indexes: { 'by-updated-at': string }
  }
  assets: {
    key: string
    value: ImageAssetRecord
  }
  settings: {
    key: string
    value: SettingRecord
  }
}

let databasePromise: Promise<IDBPDatabase<TacticalBoardSchema>> | null = null
/**
 * Cette classe structure le sujet “stored Scenario Migration Error” dans tactical-board.
 *
 * Fichier: src/tactical-board/persistence/tacticalBoardRepository.ts
 * Si tu lis ce fichier pour apprendre, regarde d’abord StoredScenarioMigrationError dans tacticalBoardRepository.ts.
 */


export class StoredScenarioMigrationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'StoredScenarioMigrationError'
  }
}
/**
 * Cette fonction teste le sujet “record” dans tactical-board.
 *
 * Fichier: src/tactical-board/persistence/tacticalBoardRepository.ts
 * Si tu lis ce fichier pour apprendre, regarde d’abord isRecord dans tacticalBoardRepository.ts.
 */


function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

/**
 * Convertit les anciens documents sans perdre de champ. La migration s'effectue
 * dans la transaction de lecture pour ne jamais exposer une bibliothèque partielle.
 */
export function migrateStoredScenario(value: unknown): ScenarioDocumentV1 {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.updatedAt !== 'string') {
    throw new StoredScenarioMigrationError('Un scénario sauvegardé est illisible.')
  }

  if (value.formatVersion === SCENARIO_FORMAT_VERSION) {
    return value as unknown as ScenarioDocumentV1
  }

  if (!isLegacyScenarioDocumentV1(value)) {
    throw new StoredScenarioMigrationError(
      `La version ${String(value.formatVersion)} d’un scénario sauvegardé n’est pas prise en charge.`,
    )
  }

  if (!Array.isArray(value.factions)) {
    throw new StoredScenarioMigrationError('Les factions d’un ancien scénario sont illisibles.')
  }
  return migrateScenarioDocumentV1(value)
}

/** Ouvre une seule connexion partagée ; cet appel ne doit être atteint que depuis `/board`. */
export function openTacticalBoardDatabase(): Promise<IDBPDatabase<TacticalBoardSchema>> {
  databasePromise ??= openDB<TacticalBoardSchema>(DATABASE_NAME, DATABASE_VERSION, {
    upgrade(database) {
      const scenarios = database.createObjectStore('scenarios', { keyPath: 'id' })
      scenarios.createIndex('by-updated-at', 'updatedAt')
      database.createObjectStore('assets', { keyPath: 'id' })
      database.createObjectStore('settings', { keyPath: 'key' })
    },
  })
  return databasePromise
}

/** Parcourt une structure sérialisable et collecte ses références d’assets sans la modifier. */
export function collectReferencedAssetIds(value: unknown): Set<string> {
  const ids = new Set<string>()
  const visited = new Set<object>()

  const visit = (candidate: unknown) => {
    if (!candidate || typeof candidate !== 'object') return
    if (visited.has(candidate)) return
    visited.add(candidate)

    if (Array.isArray(candidate)) {
      for (const entry of candidate) visit(entry)
      return
    }

    const record = candidate as Record<string, unknown>
    if (typeof record.assetId === 'string' && record.assetId) ids.add(record.assetId)
    for (const child of Object.values(record)) visit(child)
  }

  visit(value)
  return ids
}

/** Façade transactionnelle des stores `scenarios`, `assets` et `settings`. */
export class TacticalBoardRepository {
  async listScenarios(): Promise<ScenarioDocumentV1[]> {
    const database = await openTacticalBoardDatabase()
    const transaction = database.transaction('scenarios', 'readwrite')
    try {
      const stored = await transaction.store.index('by-updated-at').getAll()
      const scenarios = stored.map(migrateStoredScenario)
      const migrated = scenarios.filter((scenario, index) => scenario !== stored[index])
      await Promise.all([
        ...migrated.map((scenario) => transaction.store.put(scenario)),
        transaction.done,
      ])
      return scenarios.reverse()
    } catch (error) {
      try {
        transaction.abort()
      } catch {
        // Le navigateur peut avoir déjà interrompu ou fermé la transaction.
      }
      await transaction.done.catch(() => undefined)
      throw error
    }
  }

  async getScenario(id: string): Promise<ScenarioDocumentV1 | undefined> {
    const database = await openTacticalBoardDatabase()
    const transaction = database.transaction('scenarios', 'readwrite')
    try {
      const stored = await transaction.store.get(id)
      if (!stored) {
        await transaction.done
        return undefined
      }
      const scenario = migrateStoredScenario(stored)
      if (scenario !== stored) await transaction.store.put(scenario)
      await transaction.done
      return scenario
    } catch (error) {
      try {
        transaction.abort()
      } catch {
        // Le navigateur peut avoir déjà interrompu ou fermé la transaction.
      }
      await transaction.done.catch(() => undefined)
      throw error
    }
  }

  async saveScenario(scenario: ScenarioDocumentV1): Promise<void> {
    await (await openTacticalBoardDatabase()).put('scenarios', scenario)
  }

  async saveScenarioWithSettings(
    scenario: ScenarioDocumentV1,
    settings: Readonly<Record<string, unknown>>,
  ): Promise<void> {
    const database = await openTacticalBoardDatabase()
    const transaction = database.transaction(['scenarios', 'settings'], 'readwrite')
    const transactionDone = transaction.done
    void transactionDone.catch(() => undefined)
    const writes: Promise<unknown>[] = []
    const enqueue = (write: Promise<unknown>) => {
      writes.push(write)
      void write.catch(() => undefined)
    }
    try {
      enqueue(transaction.objectStore('scenarios').put(scenario))
      for (const [key, value] of Object.entries(settings)) {
        enqueue(transaction.objectStore('settings').put({ key, value }))
      }
      await Promise.all([...writes, transactionDone])
    } catch (error) {
      try {
        transaction.abort()
      } catch {
        // Le navigateur peut avoir déjà interrompu ou fermé la transaction.
      }
      await Promise.allSettled(writes)
      await transactionDone.catch(() => undefined)
      throw error
    }
  }

  async deleteScenario(id: string): Promise<void> {
    await (await openTacticalBoardDatabase()).delete('scenarios', id)
  }

  async getAsset(id: string): Promise<ImageAssetRecord | undefined> {
    return (await openTacticalBoardDatabase()).get('assets', id)
  }

  async listAssets(): Promise<ImageAssetRecord[]> {
    return (await openTacticalBoardDatabase()).getAll('assets')
  }

  async saveAsset(asset: ImageAssetRecord): Promise<void> {
    await (await openTacticalBoardDatabase()).put('assets', asset)
  }

  async deleteAsset(id: string): Promise<void> {
    await (await openTacticalBoardDatabase()).delete('assets', id)
  }

  async saveScenarioWithAssets(
    scenario: ScenarioDocumentV1,
    assets: readonly ImageAssetRecord[],
  ): Promise<void> {
    // Le scénario importé et ses images deviennent visibles dans une même transaction.
    const database = await openTacticalBoardDatabase()
    const transaction = database.transaction(['scenarios', 'assets'], 'readwrite')
    await Promise.all([
      transaction.objectStore('scenarios').put(scenario),
      ...assets.map((asset) => transaction.objectStore('assets').put(asset)),
      transaction.done,
    ])
  }

  async getSetting<T>(key: string): Promise<T | undefined> {
    const record = await (await openTacticalBoardDatabase()).get('settings', key)
    return record?.value as T | undefined
  }

  async setSetting<T>(key: string, value: T): Promise<void> {
    await (await openTacticalBoardDatabase()).put('settings', { key, value })
  }

  async deleteSetting(key: string): Promise<void> {
    await (await openTacticalBoardDatabase()).delete('settings', key)
  }

  async cleanupOrphanAssets(): Promise<string[]> {
    const database = await openTacticalBoardDatabase()
    const [scenarios, assets] = await Promise.all([
      database.getAll('scenarios'),
      database.getAll('assets'),
    ])
    const referenced = new Set<string>()
    for (const scenario of scenarios) {
      for (const id of collectReferencedAssetIds(scenario)) referenced.add(id)
    }

    const orphanIds = assets.filter((asset) => !referenced.has(asset.id)).map((asset) => asset.id)
    if (!orphanIds.length) return []

    const transaction = database.transaction('assets', 'readwrite')
    await Promise.all([
      ...orphanIds.map((id) => transaction.store.delete(id)),
      transaction.done,
    ])
    return orphanIds
  }
}

export const tacticalBoardRepository = new TacticalBoardRepository()
/**
 * Cette fonction ferme le sujet “tactical Board Database” dans tactical-board.
 *
 * Fichier: src/tactical-board/persistence/tacticalBoardRepository.ts
 * Si tu lis ce fichier pour apprendre, regarde d’abord closeTacticalBoardDatabase dans tacticalBoardRepository.ts.
 */


export async function closeTacticalBoardDatabase(): Promise<void> {
  if (!databasePromise) return
  const database = await databasePromise
  database.close()
  databasePromise = null
}
/**
 * Cette fonction intervient sur le sujet “delete Tactical Board Database” dans tactical-board.
 *
 * Fichier: src/tactical-board/persistence/tacticalBoardRepository.ts
 * Si tu lis ce fichier pour apprendre, regarde d’abord deleteTacticalBoardDatabase dans tacticalBoardRepository.ts.
 */


export async function deleteTacticalBoardDatabase(): Promise<void> {
  await closeTacticalBoardDatabase()
  await deleteDB(DATABASE_NAME)
}
