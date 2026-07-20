/** Budgets graphiques utilisés avant et pendant la mesure de performance du canvas. */
export type GhostSignalQuality = 'high' | 'low'

export interface GhostSignalQualityProfile {
  readonly id: GhostSignalQuality
  readonly dpr: readonly [minimum: number, maximum: number]
  readonly segments: readonly [radial: number, vertical: number]
  readonly echoes: 1 | 2
  readonly fragments: 10 | 18
  readonly backShell: boolean
  readonly atmosphericLines: boolean
  readonly estimatedDrawCalls: number
  readonly estimatedTriangles: number
}
export const GHOST_SIGNAL_PROFILES = {
  high: {
    id: 'high',
    dpr: [1, 1.5],
    segments: [24, 64],
    echoes: 2,
    fragments: 18,
    backShell: true,
    atmosphericLines: true,
    estimatedDrawCalls: 7,
    estimatedTriangles: 15_672,
  },
  low: {
    id: 'low',
    dpr: [1, 1],
    segments: [16, 40],
    echoes: 1,
    fragments: 10,
    backShell: false,
    atmosphericLines: false,
    estimatedDrawCalls: 4,
    estimatedTriangles: 3_976,
  },
} as const satisfies Record<'high' | 'low', GhostSignalQualityProfile>

export interface GhostSignalQualitySignals {
  readonly viewportWidth: number
  readonly hardwareConcurrency?: number
  readonly deviceMemory?: number
}

/** Choisit un profil initial prudent avant que la mesure des images prenne le relais. */
export function selectInitialQuality({
  viewportWidth,
  hardwareConcurrency,
  deviceMemory,
}: GhostSignalQualitySignals): GhostSignalQuality {
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
  return quality === 'high' ? 'low' : 'low'
}

export const GHOST_SIGNAL_PERFORMANCE_POLICY = {
  warmupSeconds: 3,
  sampleSeconds: 1,
  highDeclineFps: 30,
  fallbackFps: 24,
  declineWindows: 2,
  fallbackWindows: 4,
} as const

export interface GhostSignalPerformanceState {
  readonly declineWindows: number
  readonly fallbackWindows: number
}

export interface GhostSignalPerformanceDecision extends GhostSignalPerformanceState {
  readonly action: 'none' | 'degrade' | 'fallback'
}

/**
 * Politique pure d'évaluation : le profil bas persiste et seule une cadence
 * durablement inférieure à 24 IPS peut désactiver WebGL.
 */
export function evaluatePerformanceWindow(
  profile: GhostSignalQuality,
  fps: number,
  state: GhostSignalPerformanceState,
): GhostSignalPerformanceDecision {
  const fallbackWindows = fps < GHOST_SIGNAL_PERFORMANCE_POLICY.fallbackFps
    ? state.fallbackWindows + 1
    : 0
  const declineWindows = profile === 'high' && fps < GHOST_SIGNAL_PERFORMANCE_POLICY.highDeclineFps
    ? state.declineWindows + 1
    : 0

  if (profile === 'low' && fallbackWindows >= GHOST_SIGNAL_PERFORMANCE_POLICY.fallbackWindows) {
    return { action: 'fallback', declineWindows, fallbackWindows }
  }
  if (profile === 'high' && declineWindows >= GHOST_SIGNAL_PERFORMANCE_POLICY.declineWindows) {
    return { action: 'degrade', declineWindows, fallbackWindows }
  }
  return { action: 'none', declineWindows, fallbackWindows }
}
