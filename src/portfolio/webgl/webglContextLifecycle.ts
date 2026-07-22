export interface WebGLContextLifecycleCallbacks {
  readonly onLost: () => void
  readonly onRestored: () => void
  readonly onPermanentFailure: () => void
}
/**
 * Laisse le navigateur restaurer un contexte perdu pendant un délai borné,
 * puis confie durablement le rendu à l'image statique.
 */
export function bindWebGLContextLifecycle(
  canvas: HTMLCanvasElement,
  callbacks: WebGLContextLifecycleCallbacks,
  recoveryTimeout = 3_000,
): () => void {
  let lost = false
  let failureTimer: ReturnType<typeof setTimeout> | undefined

  const clearFailureTimer = () => {
    if (failureTimer === undefined) return
    clearTimeout(failureTimer)
    failureTimer = undefined
  }

  const handleLost = (event: Event) => {
    event.preventDefault()
    lost = true
    clearFailureTimer()
    callbacks.onLost()
    failureTimer = setTimeout(() => {
      failureTimer = undefined
      if (lost) callbacks.onPermanentFailure()
    }, recoveryTimeout)
  }

  const handleRestored = () => {
    if (!lost) return
    lost = false
    clearFailureTimer()
    callbacks.onRestored()
  }

  canvas.addEventListener('webglcontextlost', handleLost)
  canvas.addEventListener('webglcontextrestored', handleRestored)

  return () => {
    lost = false
    clearFailureTimer()
    canvas.removeEventListener('webglcontextlost', handleLost)
    canvas.removeEventListener('webglcontextrestored', handleRestored)
  }
}
