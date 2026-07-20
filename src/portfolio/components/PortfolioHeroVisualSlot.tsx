/**
 * @packageDocumentation
 * Composant visuel réutilisable du portfolio.
 *
 * Ce fichier découpe l'interface en une petite pièce lisible: en-tête, carte,
 * section, indice ou bloc de liens. Si tu veux modifier ce que l'utilisateur
 * voit à l'écran, c'est souvent ici qu'il faut commencer.
 */

import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { HeroWebGLErrorBoundary } from '../webgl/HeroWebGLErrorBoundary'
import { useHeroActivity } from '../webgl/useHeroActivity'
import type { GhostSignalCanvasDiagnostics } from '../webgl/GhostSignalCanvas'
import {
  canRunGhostSignal,
  getDataSavingConnection,
  getCapabilityFallbackCause,
  readGhostSignalCapabilities,
  type GhostSignalCapabilities,
  type GhostSignalFallbackCause,
} from '../webgl/ghostSignalCapabilities'

const GhostSignalCanvas = lazy(() => import('../webgl/GhostSignalCanvas'))

interface HeroVisualSlotProps {
  src: string
  alt: string
  onSignalChange?: (active: boolean) => void
}

type GhostSignalCanvasState = 'detecting' | 'loading' | 'ready' | 'suspended' | 'fallback'

const INITIAL_CAPABILITIES: GhostSignalCapabilities = {
  reducedMotion: false,
  saveData: false,
  webgl2: false,
}

/**
 * L'image canonique reste le premier rendu. Le fragment WebGL isolé ne se charge
 * qu'après validation des capacités locales du navigateur.
 */
export function HeroVisualSlot({ src, alt, onSignalChange }: HeroVisualSlotProps) {
  const heroRef = useRef<HTMLElement>(null)
  const signalChangeRef = useRef(onSignalChange)
  const technicalFailureRef = useRef<GhostSignalFallbackCause | null>(null)
  const [eligible, setEligible] = useState(false)
  const [capabilities, setCapabilities] = useState(INITIAL_CAPABILITIES)
  const [capabilityFallback, setCapabilityFallback] = useState<GhostSignalFallbackCause | null>(null)
  const [technicalFallback, setTechnicalFallback] = useState<GhostSignalFallbackCause | null>(null)
  const [canvasState, setCanvasState] = useState<GhostSignalCanvasState>('detecting')
  const [runtime, setRuntime] = useState<GhostSignalCanvasDiagnostics>({
    fps: null,
    profile: 'high',
  })
  const active = useHeroActivity(heroRef, eligible && !technicalFallback)

  signalChangeRef.current = onSignalChange

  const handleSignalChange = useCallback((nextActive: boolean) => {
    signalChangeRef.current?.(nextActive)
  }, [])
  const clearSignal = useCallback(() => handleSignalChange(false), [handleSignalChange])
  const handleDiagnostics = useCallback((diagnostics: GhostSignalCanvasDiagnostics) => {
    setRuntime(diagnostics)
  }, [])
  const handleLoading = useCallback(() => setCanvasState('loading'), [])
  const handleReady = useCallback(() => setCanvasState('ready'), [])
  const handleSuspended = useCallback(() => setCanvasState('suspended'), [])
  const handleFailure = useCallback((cause: GhostSignalFallbackCause) => {
    technicalFailureRef.current = cause
    setTechnicalFallback(cause)
    setCanvasState('fallback')
    clearSignal()
  }, [clearSignal])
  const handleReactError = useCallback(() => handleFailure('react-error'), [handleFailure])

  useEffect(() => {
    const motionPreference = typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : null
    const connection = getDataSavingConnection()

    const evaluate = () => {
      const nextCapabilities = readGhostSignalCapabilities()
      const nextFallback = getCapabilityFallbackCause(nextCapabilities)
      const nextEligible = canRunGhostSignal(nextCapabilities)
      setCapabilities(nextCapabilities)
      setCapabilityFallback(nextFallback)
      setEligible(nextEligible)
      if (!nextEligible) {
        setCanvasState('fallback')
        clearSignal()
      } else if (!technicalFailureRef.current) {
        setCanvasState('loading')
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

  const fallbackCause = technicalFallback ?? capabilityFallback
  const webglEnabled = eligible && !technicalFallback
  const ready = canvasState === 'ready'

  return (
    <figure
      className="hero-visual-slot"
      data-hero-visual-slot
      data-webgl-active={active ? 'true' : 'false'}
      data-webgl-fallback-cause={fallbackCause ?? 'none'}
      data-webgl-fps={runtime.fps ?? 'measuring'}
      data-webgl-profile={webglEnabled ? runtime.profile : 'none'}
      data-webgl-reduced-motion={capabilities.reducedMotion ? 'true' : 'false'}
      data-webgl-save-data={capabilities.saveData ? 'true' : 'false'}
      data-webgl-state={canvasState}
      data-webgl2={capabilities.webgl2 ? 'true' : 'false'}
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
          <HeroWebGLErrorBoundary onError={handleReactError}>
            <Suspense fallback={null}>
              <GhostSignalCanvas
                active={active}
                host={heroRef.current}
                onDiagnostics={handleDiagnostics}
                onFailure={handleFailure}
                onLoading={handleLoading}
                onReady={handleReady}
                onSignalChange={handleSignalChange}
                onSuspended={handleSuspended}
              />
            </Suspense>
          </HeroWebGLErrorBoundary>
        ) : null}
      </div>
      {import.meta.env.DEV ? (
        <output aria-hidden="true" className="ghost-signal-diagnostics" data-ghost-diagnostics>
          <strong>GHOST / DEV</strong>
          <span>WEBGL2 {capabilities.webgl2 ? 'OUI' : 'NON'}</span>
          <span>MOUVEMENT RÉDUIT {capabilities.reducedMotion ? 'OUI' : 'NON'}</span>
          <span>ÉCONOMIE DONNÉES {capabilities.saveData ? 'OUI' : 'NON'}</span>
          <span>PROFIL {webglEnabled ? runtime.profile.toUpperCase() : 'AUCUN'}</span>
          <span>CANVAS {canvasState.toUpperCase()}</span>
          <span>FALLBACK {fallbackCause ?? 'AUCUN'}</span>
          <span>FPS {runtime.fps ?? 'MESURE…'}</span>
        </output>
      ) : null}
      <figcaption>
        {ready
          ? 'GHOST SIGNAL / TEMPS RÉEL'
          : canvasState === 'fallback'
            ? 'SIGNAL STATIQUE'
            : 'GHOST SIGNAL'}
      </figcaption>
    </figure>
  )
}
