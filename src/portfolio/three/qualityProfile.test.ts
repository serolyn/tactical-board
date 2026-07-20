import { describe, expect, it } from 'vitest'
import {
  GHOST_SIGNAL_PROFILES,
  degradeQuality,
  evaluatePerformanceWindow,
  selectInitialQuality,
  type GhostSignalPerformanceDecision,
} from './qualityProfile'

describe('profils de qualité Ghost Signal', () => {
  it('réserve le profil high aux écrans et appareils suffisamment capables', () => {
    expect(selectInitialQuality({
      viewportWidth: 1440,
      hardwareConcurrency: 12,
      deviceMemory: 16,
    })).toBe('high')
    expect(selectInitialQuality({
      viewportWidth: 390,
      hardwareConcurrency: 8,
      deviceMemory: 8,
    })).toBe('low')
    expect(selectInitialQuality({ viewportWidth: 1024, hardwareConcurrency: 4 })).toBe('low')
    expect(selectInitialQuality({ viewportWidth: 1024, deviceMemory: 4 })).toBe('low')
  })

  it('dégrade de high vers low sans jamais supprimer la forme Low', () => {
    expect(degradeQuality('high')).toBe('low')
    expect(degradeQuality('low')).toBe('low')
  })

  it('respecte les budgets de rendu documentés', () => {
    expect(GHOST_SIGNAL_PROFILES.high).toMatchObject({
      dpr: [1, 1.5],
      echoes: 2,
      estimatedDrawCalls: 7,
      estimatedTriangles: 15_672,
    })
    expect(GHOST_SIGNAL_PROFILES.low).toMatchObject({
      dpr: [1, 1],
      echoes: 1,
      estimatedDrawCalls: 4,
      estimatedTriangles: 3_976,
    })
  })

  it('réserve le fallback à quatre fenêtres Low durablement sous 24 FPS', () => {
    let state: GhostSignalPerformanceDecision = {
      action: 'none',
      declineWindows: 0,
      fallbackWindows: 0,
    }
    for (let index = 0; index < 3; index += 1) {
      state = evaluatePerformanceWindow('low', 23, state)
      expect(state.action).toBe('none')
    }
    expect(evaluatePerformanceWindow('low', 23, state).action).toBe('fallback')
    expect(evaluatePerformanceWindow('low', 24, state)).toMatchObject({
      action: 'none',
      fallbackWindows: 0,
    })
  })

  it('dégrade High séparément et réinitialise les séries avec une fenêtre saine', () => {
    const first = evaluatePerformanceWindow('high', 29, {
      declineWindows: 0,
      fallbackWindows: 0,
    })
    expect(first.action).toBe('none')
    expect(evaluatePerformanceWindow('high', 29, first).action).toBe('degrade')
    expect(evaluatePerformanceWindow('high', 55, first)).toMatchObject({
      action: 'none',
      declineWindows: 0,
      fallbackWindows: 0,
    })
  })
})
