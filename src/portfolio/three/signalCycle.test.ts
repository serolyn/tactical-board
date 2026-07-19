import { describe, expect, it } from 'vitest'
import {
  GHOST_SIGNAL_CYCLE_SECONDS,
  getGhostSignalIntensity,
} from './signalCycle'

describe('cycle du signal rouge', () => {
  it('respire sur 16,2 secondes et garde la braise rare', () => {
    expect(GHOST_SIGNAL_CYCLE_SECONDS).toBeGreaterThanOrEqual(14)
    expect(GHOST_SIGNAL_CYCLE_SECONDS).toBeLessThanOrEqual(18)
    expect(getGhostSignalIntensity(2)).toBe(0)
    expect(getGhostSignalIntensity(GHOST_SIGNAL_CYCLE_SECONDS * 0.76)).toBeCloseTo(1, 5)
    expect(getGhostSignalIntensity(GHOST_SIGNAL_CYCLE_SECONDS * 0.9)).toBe(0)
  })

  it('entre et sort sans clignotement brutal', () => {
    const before = getGhostSignalIntensity(GHOST_SIGNAL_CYCLE_SECONDS * 0.68)
    const entering = getGhostSignalIntensity(GHOST_SIGNAL_CYCLE_SECONDS * 0.7)
    const leaving = getGhostSignalIntensity(GHOST_SIGNAL_CYCLE_SECONDS * 0.82)
    const after = getGhostSignalIntensity(GHOST_SIGNAL_CYCLE_SECONDS * 0.84)

    expect(before).toBe(0)
    expect(entering).toBeGreaterThan(0)
    expect(leaving).toBeGreaterThan(0)
    expect(after).toBeCloseTo(0, 8)
  })
})
