export type GhostSignalQuality = 'high' | 'low' | 'fallback'

export interface GhostSignalQualityProfile {
  readonly id: Exclude<GhostSignalQuality, 'fallback'>
  readonly dpr: readonly [minimum: number, maximum: number]
  readonly segments: readonly [width: number, height: number]
  readonly layers: 2 | 3
  readonly atmosphericLines: boolean
  readonly estimatedDrawCalls: number
  readonly estimatedTriangles: number
}
export const GHOST_SIGNAL_PROFILES = {
  high: {
    id: 'high',
    dpr: [1, 1.5],
    segments: [56, 80],
    layers: 3,
    atmosphericLines: true,
    estimatedDrawCalls: 4,
    estimatedTriangles: 26_880,
  },
  low: {
    id: 'low',
    dpr: [1, 1],
    segments: [32, 48],
    layers: 2,
    atmosphericLines: false,
    estimatedDrawCalls: 2,
    estimatedTriangles: 6_144,
  },
} as const satisfies Record<'high' | 'low', GhostSignalQualityProfile>

export interface QualitySignals {
  readonly viewportWidth: number
  readonly hardwareConcurrency?: number
  readonly deviceMemory?: number
}

/** Chooses a conservative first profile before live frame-rate monitoring takes over. */
export function selectInitialQuality({
  viewportWidth,
  hardwareConcurrency,
  deviceMemory,
}: QualitySignals): Exclude<GhostSignalQuality, 'fallback'> {
  if (
    viewportWidth < 720
    || (hardwareConcurrency !== undefined && hardwareConcurrency <= 4)
    || (deviceMemory !== undefined && deviceMemory <= 4)
  ) {
    return 'low'
  }

  return 'high'
}

export function degradeQuality(quality: GhostSignalQuality): GhostSignalQuality {
  if (quality === 'high') return 'low'
  return 'fallback'
}
