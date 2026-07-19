import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ScenarioDocumentV1 } from '../../domain'
import {
  clearRecoveryJournal,
  createAutosaveController,
  tacticalBoardRepository,
  writeRecoveryJournal,
  type AutosaveSnapshot,
} from '../../services'
import { selectActiveScenario, useAppStore } from '../../store/appStore'

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
          // IndexedDB remains the source of truth when localStorage is unavailable.
        }
      }),
    [],
  )

  useEffect(() => autosave.subscribe(setSaveSnapshot), [autosave])

  useEffect(
    () =>
      useAppStore.subscribe((state, previousState) => {
        const document = state.history?.present
        if (!document || document === previousState.history?.present) return
        try {
          writeRecoveryJournal(document)
        } catch {
          // Quota or privacy settings may disable this best-effort recovery journal.
        }
      }),
    [],
  )

  useEffect(() => {
    if (hydrated && activeScenario) autosave.schedule(activeScenario)
  }, [activeScenario, autosave, hydrated])

  useEffect(() => {
    const flushPendingSave = () => {
      const latestDocument = selectActiveScenario(useAppStore.getState())
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
