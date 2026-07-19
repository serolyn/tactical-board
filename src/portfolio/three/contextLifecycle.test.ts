import { afterEach, describe, expect, it, vi } from 'vitest'
import { bindWebGLContextLifecycle } from './contextLifecycle'

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})
describe('cycle de vie du contexte WebGL', () => {
  it('masque la scène à la perte puis accepte une restauration', () => {
    vi.useFakeTimers()
    const canvas = document.createElement('canvas')
    const callbacks = {
      onLost: vi.fn(),
      onRestored: vi.fn(),
      onPermanentFailure: vi.fn(),
    }
    const cleanup = bindWebGLContextLifecycle(canvas, callbacks, 2_000)
    const lostEvent = new Event('webglcontextlost', { cancelable: true })

    canvas.dispatchEvent(lostEvent)
    expect(lostEvent.defaultPrevented).toBe(true)
    expect(callbacks.onLost).toHaveBeenCalledOnce()

    vi.advanceTimersByTime(1_000)
    canvas.dispatchEvent(new Event('webglcontextrestored'))
    vi.advanceTimersByTime(2_000)

    expect(callbacks.onRestored).toHaveBeenCalledOnce()
    expect(callbacks.onPermanentFailure).not.toHaveBeenCalled()
    cleanup()
  })

  it('bascule durablement vers le fallback et nettoie timers et écouteurs', () => {
    vi.useFakeTimers()
    const canvas = document.createElement('canvas')
    const callbacks = {
      onLost: vi.fn(),
      onRestored: vi.fn(),
      onPermanentFailure: vi.fn(),
    }
    const cleanup = bindWebGLContextLifecycle(canvas, callbacks, 500)

    canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }))
    vi.advanceTimersByTime(500)
    expect(callbacks.onPermanentFailure).toHaveBeenCalledOnce()

    cleanup()
    canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }))
    vi.advanceTimersByTime(500)
    expect(callbacks.onLost).toHaveBeenCalledOnce()
    expect(callbacks.onPermanentFailure).toHaveBeenCalledOnce()
  })
})
