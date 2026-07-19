export const GHOST_SIGNAL_CYCLE_SECONDS = 16.2

/** Smooth, rare pulse shared by the shader uniform and the DOM signal marker. */
export function getGhostSignalIntensity(elapsed: number): number {
  const phase = (elapsed % GHOST_SIGNAL_CYCLE_SECONDS) / GHOST_SIGNAL_CYCLE_SECONDS
  if (phase < 0.68 || phase > 0.84) return 0
  const localPhase = (phase - 0.68) / 0.16
  return Math.sin(localPhase * Math.PI) ** 2
}
