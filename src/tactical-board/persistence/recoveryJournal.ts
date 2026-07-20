/**
 * @packageDocumentation
 * Persistance locale de Tactical Board.
 *
 * Ce dossier explique comment le board enregistre ses scénarios dans IndexedDB,
 * recharge les données au démarrage et garde un journal de récupération.
 */

/** Sécurise les modifications récentes pendant le délai de l'autosauvegarde IndexedDB. */
import {
  legacyScenarioDocumentSchema,
  scenarioDocumentSchema,
} from '@/tactical-board/model/scenarioDocumentSchema'
import { migrateScenarioDocumentV1 } from '@/tactical-board/model/scenarioDocument'
import type {
  LegacyScenarioDocumentV1,
  ScenarioDocumentV1,
} from '@/tactical-board/model/tacticalBoardTypes'

export const RECOVERY_JOURNAL_KEY = 'tactical-board:scenario-recovery:v1'

export type RecoveryStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
/**
 * Cette classe structure le sujet “recovery Journal Error” dans tactical-board.
 *
 * Fichier: src/tactical-board/persistence/recoveryJournal.ts
 * Si tu lis ce fichier pour apprendre, regarde d’abord RecoveryJournalError dans recoveryJournal.ts.
 */


export class RecoveryJournalError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RecoveryJournalError'
  }
}
/**
 * Cette fonction intervient sur le sujet “browser Storage” dans tactical-board.
 *
 * Fichier: src/tactical-board/persistence/recoveryJournal.ts
 * Si tu lis ce fichier pour apprendre, regarde d’abord browserStorage dans recoveryJournal.ts.
 */


function browserStorage(): RecoveryStorage {
  if (typeof window === 'undefined' || !window.localStorage) {
    throw new RecoveryJournalError('Le stockage de reprise n’est pas disponible.')
  }
  return window.localStorage
}
/**
 * Cette fonction vérifie le sujet “d Json” dans tactical-board.
 *
 * Fichier: src/tactical-board/persistence/recoveryJournal.ts
 * Si tu lis ce fichier pour apprendre, regarde d’abord validatedJson dans recoveryJournal.ts.
 */


function validatedJson(document: ScenarioDocumentV1): string {
  const parsed = scenarioDocumentSchema.safeParse(document)
  if (!parsed.success) {
    throw new RecoveryJournalError('Le scénario ne peut pas être inscrit dans le journal de reprise.')
  }
  // La valeur validée garantit un ordre de clés canonique pour comparer le journal.
  return JSON.stringify(parsed.data)
}

/**
 * Inscrit immédiatement le dernier document mémoire et renvoie son jeton JSON exact.
 * localStorage sert uniquement de pont pendant le délai de regroupement d'IndexedDB.
 */
export function writeRecoveryJournal(
  document: ScenarioDocumentV1,
  storage: RecoveryStorage = browserStorage(),
): string {
  const json = validatedJson(document)
  storage.setItem(RECOVERY_JOURNAL_KEY, json)
  return json
}

/** Ignore un journal absent, malformé, futur ou sémantiquement invalide. */
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
 * Efface le journal seulement s'il contient encore le document qui vient d'être persisté.
 * Une modification plus récente écrite pendant la sauvegarde reste ainsi intacte.
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
