/** Branche le document actif sur le journal de reprise et l'autosauvegarde sérialisée. */
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ScenarioDocumentV1 } from '@/tactical-board/model/tacticalBoardTypes'
import {
  clearRecoveryJournal,
  writeRecoveryJournal,
} from '@/tactical-board/persistence/recoveryJournal'
import {
  createAutosaveController,
  type AutosaveSnapshot,
} from '@/tactical-board/persistence/scenarioAutosave'
import { tacticalBoardRepository } from '@/tactical-board/persistence/tacticalBoardRepository'
import {
  selectActiveScenario,
  useTacticalBoardStore,
} from '@/tactical-board/state/tacticalBoardStore'

export interface ScenarioAutosaveState {
  saveSnapshot: AutosaveSnapshot
  flushAutosaveOrThrow(): Promise<void>
  forceSave(): Promise<void>
  retry(): Promise<void>
}

export function useScenarioAutosave(
  activeScenario: ScenarioDocumentV1 | null,
  hydrated: boolean,
): ScenarioAutosaveState {
  const [saveSnapshot, setSaveSnapshot] = useState<AutosaveSnapshot>({
    state: 'idle',
    error: null,
    lastSavedAt: null,
  })

  const autosave = useMemo(
    () =>
      createAutosaveController<ScenarioDocumentV1>(async (document) => {
        await tacticalBoardRepository.saveScenario(document)
        try {
          clearRecoveryJournal(document)
        } catch {
          // IndexedDB reste la source de vérité si localStorage est indisponible.
        }
      }),
    [],
  )

  useEffect(() => autosave.subscribe(setSaveSnapshot), [autosave])

  useEffect(
    () =>
      useTacticalBoardStore.subscribe((state, previousState) => {
        const document = state.history?.present
        if (!document || document === previousState.history?.present) return
        try {
          writeRecoveryJournal(document)
        } catch {
          // Le quota ou la confidentialité peuvent désactiver ce journal facultatif.
        }
      }),
    [],
  )

  useEffect(() => {
    if (hydrated && activeScenario) autosave.schedule(activeScenario)
  }, [activeScenario, autosave, hydrated])

  useEffect(() => {
    const flushPendingSave = () => {
      const latestDocument = selectActiveScenario(useTacticalBoardStore.getState())
      if (latestDocument) autosave.schedule(latestDocument)
      void autosave.flush()
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flushPendingSave()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pagehide', flushPendingSave)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pagehide', flushPendingSave)
    }
  }, [autosave])

  const flushAutosaveOrThrow = useCallback(async () => {
    await autosave.flush()
    const snapshot = autosave.getSnapshot()
    if (snapshot.state === 'error') {
      throw snapshot.error ?? new Error('Échec de la sauvegarde.')
    }
  }, [autosave])

  const forceSave = useCallback(async () => {
    if (activeScenario) autosave.schedule(activeScenario)
    await flushAutosaveOrThrow()
  }, [activeScenario, autosave, flushAutosaveOrThrow])

  const retry = useCallback(() => autosave.retry(), [autosave])

  return { saveSnapshot, flushAutosaveOrThrow, forceSave, retry }
}
