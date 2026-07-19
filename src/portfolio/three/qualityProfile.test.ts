import { describe, expect, it } from 'vitest'
import {
  GHOST_SIGNAL_PROFILES,
  degradeQuality,
  selectInitialQuality,
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

  it('dégrade de high vers low puis vers le fallback statique', () => {
    expect(degradeQuality('high')).toBe('low')
    expect(degradeQuality('low')).toBe('fallback')
    expect(degradeQuality('fallback')).toBe('fallback')
  })

  it('respecte les budgets de rendu documentés', () => {
    expect(GHOST_SIGNAL_PROFILES.high).toMatchObject({
      dpr: [1, 1.5],
      layers: 3,
      estimatedDrawCalls: 4,
      estimatedTriangles: 26_880,
    })
    expect(GHOST_SIGNAL_PROFILES.low).toMatchObject({
      dpr: [1, 1],
      layers: 2,
      estimatedDrawCalls: 2,
      estimatedTriangles: 6_144,
    })
  })
})
