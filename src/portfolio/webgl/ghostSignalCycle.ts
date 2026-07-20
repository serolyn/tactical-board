/**
 * @packageDocumentation
 * Effets WebGL du portfolio.
 *
 * Ce dossier contient la partie visuelle avancée du hero: shaders, scènes et
 * fallback. Si WebGL n'est pas disponible, ces fichiers expliquent aussi quoi
 * faire à la place.
 */

export const GHOST_SIGNAL_CYCLE_SECONDS = 16.2

/** Impulsion rare et lissée, partagée par le shader et le marqueur DOM. */
export function getGhostSignalIntensity(elapsed: number): number {
  const phase = (elapsed % GHOST_SIGNAL_CYCLE_SECONDS) / GHOST_SIGNAL_CYCLE_SECONDS
  if (phase < 0.68 || phase > 0.84) return 0
  const localPhase = (phase - 0.68) / 0.16
  return Math.sin(localPhase * Math.PI) ** 2
}
