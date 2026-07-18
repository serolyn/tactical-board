// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest'
import { createDefaultScenario, type ScenarioDocumentV1 } from '../domain'
import {
  clearRecoveryJournal,
  readRecoveryJournal,
  RECOVERY_JOURNAL_KEY,
  RecoveryJournalError,
  type RecoveryStorage,
  writeRecoveryJournal,
} from './recoveryJournal'

function renamedScenario(name: string, second: number): ScenarioDocumentV1 {
  const source = createDefaultScenario('Source', {
    id: 'scenario-recovery',
    now: '2026-01-01T00:00:00.000Z',
  })
  return {
    ...source,
    name,
    updatedAt: `2026-01-01T00:00:${String(second).padStart(2, '0')}.000Z`,
  }
}

function memoryStorage(): RecoveryStorage & { values: Map<string, string> } {
  const values = new Map<string, string>()
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value)
    },
    removeItem: (key) => {
      values.delete(key)
    },
  }
}

describe('recoveryJournal', () => {
  beforeEach(() => localStorage.clear())

  it('écrit et relit un document validé dans localStorage', () => {
    const document = renamedScenario('Opération reprise', 1)
    const json = writeRecoveryJournal(document)

    expect(localStorage.getItem(RECOVERY_JOURNAL_KEY)).toBe(json)
    expect(readRecoveryJournal()).toEqual(document)
  })

  it('ignore un JSON malformé ou un document non conforme', () => {
    localStorage.setItem(RECOVERY_JOURNAL_KEY, '{invalide')
    expect(readRecoveryJournal()).toBeNull()

    localStorage.setItem(
      RECOVERY_JOURNAL_KEY,
      JSON.stringify({ ...renamedScenario('Invalide', 2), formatVersion: 99 }),
    )
    expect(readRecoveryJournal()).toBeNull()
  })

  it('récupère et migre aussi un journal V1 resté avant la mise à niveau', () => {
    const current = renamedScenario('Journal ancien', 2)
    const legacy = {
      ...current,
      formatVersion: 1,
      factions: current.factions.map(({ id, name, color }) => ({ id, name, color })),
    } as Record<string, unknown>
    delete legacy.objective
    delete legacy.status
    delete legacy.period
    delete legacy.previousScenarioId
    localStorage.setItem(RECOVERY_JOURNAL_KEY, JSON.stringify(legacy))

    expect(readRecoveryJournal()).toMatchObject({
      formatVersion: 2,
      id: current.id,
      name: 'Journal ancien',
      objective: '',
      status: 'active',
    })
  })

  it('efface seulement le JSON exact qui vient d’être persisté', () => {
    const older = renamedScenario('Version 1', 1)
    const newer = renamedScenario('Version 2', 2)

    writeRecoveryJournal(older)
    expect(clearRecoveryJournal(older)).toBe(true)
    expect(readRecoveryJournal()).toBeNull()

    writeRecoveryJournal(older)
    writeRecoveryJournal(newer)
    expect(clearRecoveryJournal(older)).toBe(false)
    expect(readRecoveryJournal()).toEqual(newer)
    expect(clearRecoveryJournal(newer)).toBe(true)
  })

  it('valide avant toute écriture et accepte un Storage injecté', () => {
    const storage = memoryStorage()
    const valid = renamedScenario('Injecté', 3)
    writeRecoveryJournal(valid, storage)
    const previous = storage.values.get(RECOVERY_JOURNAL_KEY)

    const invalid = { ...valid, grid: { ...valid.grid, rows: 2 } } as ScenarioDocumentV1
    expect(() => writeRecoveryJournal(invalid, storage)).toThrow(RecoveryJournalError)
    expect(storage.values.get(RECOVERY_JOURNAL_KEY)).toBe(previous)
    expect(readRecoveryJournal(storage)).toEqual(valid)
  })
})
