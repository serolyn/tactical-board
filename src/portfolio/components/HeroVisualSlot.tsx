import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { HeroWebGLErrorBoundary } from '../three/HeroWebGLErrorBoundary'
import { useHeroActivity } from '../three/useHeroActivity'
import {
  canRunGhostSignal,
  getDataSavingConnection,
  readGhostSignalCapabilities,
} from '../three/webglSupport'

const GhostSignalCanvas = lazy(() => import('../three/GhostSignalCanvas'))

interface HeroVisualSlotProps {
  src: string
  alt: string
  onSignalChange?: (active: boolean) => void
}

/**
 * Progressive boundary: the canonical image is always rendered first and the
 * isolated WebGL chunk is mounted only after all local capability gates pass.
 */
export function HeroVisualSlot({ src, alt, onSignalChange }: HeroVisualSlotProps) {
  const heroRef = useRef<HTMLElement>(null)
  const signalChangeRef = useRef(onSignalChange)
  const [eligible, setEligible] = useState(false)
  const [failed, setFailed] = useState(false)
  const [ready, setReady] = useState(false)
  const active = useHeroActivity(heroRef, eligible && !failed)

  signalChangeRef.current = onSignalChange

  const handleSignalChange = useCallback((nextActive: boolean) => {
    signalChangeRef.current?.(nextActive)
  }, [])
  const clearSignal = useCallback(() => handleSignalChange(false), [handleSignalChange])
  const handleReady = useCallback(() => setReady(true), [])
  const handleSuspended = useCallback(() => setReady(false), [])
  const handleFailure = useCallback(() => {
    setFailed(true)
    setReady(false)
    clearSignal()
  }, [clearSignal])

  useEffect(() => {
    const motionPreference = typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : null
    const connection = getDataSavingConnection()

    const evaluate = () => {
      const nextEligible = canRunGhostSignal(readGhostSignalCapabilities())
      setEligible(nextEligible)
      if (!nextEligible) {
        setReady(false)
        clearSignal()
      }
    }

    evaluate()
    motionPreference?.addEventListener?.('change', evaluate)
    connection?.addEventListener?.('change', evaluate)

    return () => {
      motionPreference?.removeEventListener?.('change', evaluate)
      connection?.removeEventListener?.('change', evaluate)
      clearSignal()
    }
  }, [clearSignal])

  const webglEnabled = eligible && !failed

  return (
    <figure
      className="hero-visual-slot"
      data-hero-visual-slot
      data-webgl-active={active ? 'true' : 'false'}
      data-webgl-state={ready ? 'ready' : webglEnabled ? 'loading' : 'fallback'}
      ref={heroRef}
    >
      <img
        alt={alt}
        decoding="async"
        fetchPriority="high"
        height="900"
        src={src}
        width="1600"
      />
      <div
        aria-hidden="true"
        className={`hero-visual-slot__future${ready ? ' hero-visual-slot__future--ready' : ''}`}
        data-ghost-signal-mount
      >
        {webglEnabled ? (
          <HeroWebGLErrorBoundary onError={handleFailure}>
            <Suspense fallback={null}>
              <GhostSignalCanvas
                active={active}
                host={heroRef.current}
                onFailure={handleFailure}
                onReady={handleReady}
                onSignalChange={handleSignalChange}
                onSuspended={handleSuspended}
              />
            </Suspense>
          </HeroWebGLErrorBoundary>
        ) : null}
      </div>
      <figcaption>{ready ? 'GHOST SIGNAL / TEMPS RÉEL' : 'SIGNAL STATIQUE / FALLBACK VISUEL'}</figcaption>
    </figure>
  )
}
