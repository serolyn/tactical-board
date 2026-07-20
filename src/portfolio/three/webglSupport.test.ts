import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  canRunGhostSignal,
  getCapabilityFallbackCause,
  prefersDataSaving,
  prefersReducedMotion,
  supportsWebGL2,
} from './webglSupport'

afterEach(() => vi.restoreAllMocks())

describe('détection des capacités Ghost Signal', () => {
  it('valide WebGL2 et libère le contexte de détection', () => {
    const loseContext = vi.fn()
    const canvas = document.createElement('canvas')
    vi.spyOn(canvas, 'getContext').mockReturnValue({
      getExtension: () => ({ loseContext }),
    } as unknown as WebGL2RenderingContext)

    expect(supportsWebGL2(() => canvas)).toBe(true)
    expect(loseContext).toHaveBeenCalledOnce()
  })

  it('refuse un contexte absent ou une création défaillante', () => {
    const canvas = document.createElement('canvas')
    vi.spyOn(canvas, 'getContext').mockReturnValue(null)
    expect(supportsWebGL2(() => canvas)).toBe(false)
    expect(supportsWebGL2(() => { throw new Error('GPU indisponible') })).toBe(false)
  })

  it('réserve le fallback aux capacités réelles et conserve save-data comme diagnostic', () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn((query: string) => ({ matches: query.includes('reduced-motion') })),
    })
    Object.defineProperty(navigator, 'connection', {
      configurable: true,
      value: { saveData: true },
    })

    expect(prefersReducedMotion()).toBe(true)
    expect(prefersDataSaving()).toBe(true)
    expect(canRunGhostSignal({ webgl2: true, reducedMotion: true, saveData: false })).toBe(false)
    expect(canRunGhostSignal({ webgl2: true, reducedMotion: false, saveData: true })).toBe(true)
    expect(canRunGhostSignal({ webgl2: true, reducedMotion: false, saveData: false })).toBe(true)
    expect(getCapabilityFallbackCause({ webgl2: true, reducedMotion: true, saveData: false }))
      .toBe('reduced-motion')
    expect(getCapabilityFallbackCause({ webgl2: true, reducedMotion: false, saveData: true }))
      .toBeNull()
    expect(getCapabilityFallbackCause({ webgl2: false, reducedMotion: false, saveData: false }))
      .toBe('webgl2-unavailable')
    expect(getCapabilityFallbackCause({ webgl2: true, reducedMotion: false, saveData: false }))
      .toBeNull()
  })
})
