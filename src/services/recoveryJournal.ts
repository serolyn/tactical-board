import {
  migrateScenarioDocumentV1,
  type LegacyScenarioDocumentV1,
  type ScenarioDocumentV1,
} from '../domain'
import { legacyScenarioDocumentSchema, scenarioDocumentSchema } from './scenarioExchange'

export const RECOVERY_JOURNAL_KEY = 'tactical-board:scenario-recovery:v1'

export type RecoveryStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export class RecoveryJournalError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RecoveryJournalError'
  }
}

function browserStorage(): RecoveryStorage {
  if (typeof window === 'undefined' || !window.localStorage) {
    throw new RecoveryJournalError('Le stockage de reprise n’est pas disponible.')
  }
  return window.localStorage
}

function validatedJson(document: ScenarioDocumentV1): string {
  const parsed = scenarioDocumentSchema.safeParse(document)
  if (!parsed.success) {
    throw new RecoveryJournalError('Le scénario ne peut pas être inscrit dans le journal de reprise.')
  }
  // Serializing Zod's parsed value gives every caller the same canonical key order.
  return JSON.stringify(parsed.data)
}

/**
 * Synchronously records the latest in-memory document and returns its exact JSON token.
 * localStorage is intentional here: this journal only bridges the IndexedDB debounce window.
 */
export function writeRecoveryJournal(
  document: ScenarioDocumentV1,
  storage: RecoveryStorage = browserStorage(),
): string {
  const json = validatedJson(document)
  storage.setItem(RECOVERY_JOURNAL_KEY, json)
  return json
}

/** Returns null for an absent, malformed, future, or semantically invalid journal. */
export function readRecoveryJournal(
  storage: RecoveryStorage = browserStorage(),
): ScenarioDocumentV1 | null {
  const json = storage.getItem(RECOVERY_JOURNAL_KEY)
  if (json === null) return null

  try {
    const value = JSON.parse(json) as unknown
    const parsed = scenarioDocumentSchema.safeParse(value)
    if (parsed.success) return parsed.data as ScenarioDocumentV1
    const legacy = legacyScenarioDocumentSchema.safeParse(value)
    return legacy.success
      ? migrateScenarioDocumentV1(legacy.data as LegacyScenarioDocumentV1)
      : null
  } catch {
    return null
  }
}

/**
 * Removes the journal only when it still contains the exact document just persisted.
 * If a newer edit was written while IndexedDB was saving, that newer entry is preserved.
 */
export function clearRecoveryJournal(
  persistedDocument: ScenarioDocumentV1,
  storage: RecoveryStorage = browserStorage(),
): boolean {
  const expectedJson = validatedJson(persistedDocument)
  if (storage.getItem(RECOVERY_JOURNAL_KEY) !== expectedJson) return false
  storage.removeItem(RECOVERY_JOURNAL_KEY)
  return true
}
