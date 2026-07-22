/** Sérialise les écritures différées et expose un état observable de sauvegarde. */
export type SaveState = 'idle' | 'pending' | 'saving' | 'saved' | 'error'

export interface AutosaveSnapshot {
  state: SaveState
  lastSavedAt: Date | null
  error: Error | null
}

export interface AutosaveController<T> {
  schedule(value: T): void
  flush(): Promise<void>
  retry(): Promise<void>
  cancel(): void
  getSnapshot(): AutosaveSnapshot
  subscribe(listener: (snapshot: AutosaveSnapshot) => void): () => void
}

/**
 * Regroupe les changements rapides et garantit une seule écriture active.
 * `flush` attend aussi toute valeur arrivée pendant une sauvegarde lente.
 */
export function createAutosaveController<T>(
  save: (value: T) => Promise<void>,
  delayMs = 350,
): AutosaveController<T> {
  let timer: ReturnType<typeof setTimeout> | null = null
  let queued: { value: T } | null = null
  let failed: { value: T } | null = null
  let running: Promise<void> | null = null
  let disposed = false
  let snapshot: AutosaveSnapshot = { state: 'idle', lastSavedAt: null, error: null }
  const listeners = new Set<(value: AutosaveSnapshot) => void>()

  const publish = (next: AutosaveSnapshot) => {
    snapshot = next
    for (const listener of listeners) listener(snapshot)
  }

  const clearTimer = () => {
    if (timer !== null) clearTimeout(timer)
    timer = null
  }

  const drain = async (): Promise<void> => {
    clearTimer()
    if (running) return running

    running = (async () => {
      while (queued && !disposed) {
        const current = queued
        queued = null
        publish({ ...snapshot, state: 'saving', error: null })

        try {
          await save(current.value)
          failed = null
          publish({ state: queued ? 'pending' : 'saved', lastSavedAt: new Date(), error: null })
        } catch (cause) {
          failed = current
          const error = cause instanceof Error ? cause : new Error('Échec de la sauvegarde.')
          publish({ ...snapshot, state: 'error', error })
          break
        }
      }
    })().finally(() => {
      running = null
      // Un minuteur peut expirer pendant une écriture lente : la valeur mémoire
      // la plus récente doit alors repartir dès la fin de la transaction active.
      if (queued && !disposed) queueMicrotask(() => void drain())
    })

    return running
  }

  const flushAll = async (): Promise<void> => {
    do {
      await drain()
    } while (queued || running)
  }

  return {
    schedule(value) {
      if (disposed) return
      queued = { value }
      failed = null
      clearTimer()
      publish({ ...snapshot, state: 'pending', error: null })
      timer = setTimeout(() => void drain(), delayMs)
    },
    async flush() {
      if (disposed) return
      await flushAll()
    },
    async retry() {
      if (disposed || !failed) return
      queued = failed
      failed = null
      publish({ ...snapshot, state: 'pending', error: null })
      await flushAll()
    },
    cancel() {
      disposed = true
      clearTimer()
      queued = null
      failed = null
      listeners.clear()
    },
    getSnapshot() {
      return snapshot
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}
