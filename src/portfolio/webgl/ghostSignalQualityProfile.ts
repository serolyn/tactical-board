/**
 * Profils graphiques utilisés par Ghost Signal.
 *
 * Le choix est effectué une seule fois au chargement. Les mêmes valeurs de rendu
 * sont conservées, mais le site ne change plus automatiquement de profil pendant
 * l'utilisation.
 */
export type GhostSignalQuality = 'high' | 'low'

export interface GhostSignalQualityProfile {
  readonly id: GhostSignalQuality
  readonly dpr: readonly [minimum: number, maximum: number]
  readonly segments: readonly [radial: number, vertical: number]
  readonly echoes: 1 | 2
  readonly fragments: 10 | 18
  readonly backShell: boolean
  readonly atmosphericLines: boolean
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
  },
  low: {
    id: 'low',
    dpr: [1, 1],
    segments: [16, 40],
    echoes: 1,
    fragments: 10,
    backShell: false,
    atmosphericLines: false,
  },
} as const satisfies Record<GhostSignalQuality, GhostSignalQualityProfile>

export interface GhostSignalQualitySignals {
  readonly viewportWidth: number
  readonly hardwareConcurrency?: number
  readonly deviceMemory?: number
}

/**
 * Conserve le choix initial historique : petit écran ou matériel modeste utilise
 * le profil bas, les autres appareils utilisent le profil haut.
 */
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
