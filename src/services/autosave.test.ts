import { afterEach, describe, expect, it, vi } from 'vitest'
import { createAutosaveController } from './autosave'

describe('createAutosaveController', () => {
  afterEach(() => vi.useRealTimers())

  it('regroupe les changements rapprochés', async () => {
    vi.useFakeTimers()
    const save = vi.fn(async (_value: number) => undefined)
    const autosave = createAutosaveController(save, 350)

    autosave.schedule(1)
    autosave.schedule(2)
    await vi.advanceTimersByTimeAsync(349)
    expect(save).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)
    expect(save).toHaveBeenCalledTimes(1)
    expect(save).toHaveBeenCalledWith(2)
    expect(autosave.getSnapshot().state).toBe('saved')
  })

  it('conserve la valeur en mémoire et permet un nouvel essai', async () => {
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

  it('sérialise une modification arrivée pendant une écriture lente', async () => {
    let releaseFirst: (() => void) | undefined
    let activeWrites = 0
    let maximumActiveWrites = 0
    const values: number[] = []
    const save = vi.fn(async (value: number) => {
      activeWrites += 1
      maximumActiveWrites = Math.max(maximumActiveWrites, activeWrites)
      values.push(value)
      if (value === 1) {
        await new Promise<void>((resolve) => {
          releaseFirst = resolve
        })
      }
      activeWrites -= 1
    })
    const autosave = createAutosaveController(save, 350)

    autosave.schedule(1)
    const flush = autosave.flush()
    await vi.waitFor(() => expect(save).toHaveBeenCalledWith(1))
    autosave.schedule(2)
    releaseFirst?.()
    await flush

    expect(values).toEqual([1, 2])
    expect(maximumActiveWrites).toBe(1)
    expect(autosave.getSnapshot().state).toBe('saved')
  })
})
