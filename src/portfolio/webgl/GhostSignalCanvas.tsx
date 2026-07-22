/**
 * Canvas de Ghost Signal.
 *
 * Le profil graphique est choisi une seule fois au chargement. Le compteur FPS
 * reste disponible pour le diagnostic, mais il ne modifie plus le rendu en cours.
 */
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { WebGLRenderer } from 'three'

import { bindWebGLContextLifecycle } from './webglContextLifecycle'
import { GhostSignalScene } from './GhostSignalScene'
import {
  GHOST_SIGNAL_PROFILES,
  selectInitialQuality,
  type GhostSignalQuality,
} from './ghostSignalQualityProfile'
import type { GhostSignalFallbackCause } from './ghostSignalCapabilities'

export interface GhostSignalCanvasDiagnostics {
  readonly fps: number | null
  readonly profile: GhostSignalQuality
}

export interface GhostSignalCanvasProps {
  readonly active: boolean
  readonly host: HTMLElement | null
  readonly onDiagnostics: (diagnostics: GhostSignalCanvasDiagnostics) => void
  readonly onFailure: (cause: GhostSignalFallbackCause) => void
  readonly onLoading: () => void
  readonly onReady: () => void
  readonly onSignalChange: (active: boolean) => void
  readonly onSuspended: () => void
}

interface NavigatorWithDeviceMemory extends Navigator {
  readonly deviceMemory?: number
}

interface GhostSignalFrameLifecycleProps {
  readonly onFailure: (cause: GhostSignalFallbackCause) => void
  readonly onReady: () => void
  readonly onRestoring: () => void
  readonly onSuspended: () => void
}

interface GhostSignalFpsMeterProps {
  readonly active: boolean
  readonly onFps: (fps: number | null) => void
}

/** Surveille le premier rendu et les pertes de contexte du canvas. */
function GhostSignalFrameLifecycle({
  onFailure,
  onReady,
  onRestoring,
  onSuspended,
}: GhostSignalFrameLifecycleProps) {
  const { gl } = useThree()
  const ready = useRef(false)
  const readyFrame = useRef<number | null>(null)

  useEffect(() => {
    const renderer = gl as WebGLRenderer
    const previousShaderError = renderer.debug.onShaderError
    renderer.debug.onShaderError = () => onFailure('shader-error')

    const cleanupContext = bindWebGLContextLifecycle(renderer.domElement, {
      onLost: () => {
        ready.current = false
        onSuspended()
      },
      onRestored: () => {
        ready.current = false
        onRestoring()
      },
      onPermanentFailure: () => onFailure('context-timeout'),
    })

    return () => {
      if (readyFrame.current !== null) cancelAnimationFrame(readyFrame.current)
      renderer.debug.onShaderError = previousShaderError
      cleanupContext()
    }
  }, [gl, onFailure, onRestoring, onSuspended])

  useFrame(() => {
    if (ready.current || readyFrame.current !== null) return

    readyFrame.current = requestAnimationFrame(() => {
      readyFrame.current = null
      const context = gl.getContext()

      if (context.isContextLost()) return
      if (context.getError() !== context.NO_ERROR) {
        onFailure('gl-error')
        return
      }

      ready.current = true
      onReady()
    })
  })

  return null
}

/**
 * Mesure uniquement les FPS pour la fenêtre de diagnostic.
 * Cette mesure n'altère ni le profil, ni les objets, ni les animations.
 */
function GhostSignalFpsMeter({ active, onFps }: GhostSignalFpsMeterProps) {
  const warmupElapsed = useRef(0)
  const sampleElapsed = useRef(0)
  const sampleFrames = useRef(0)

  useEffect(() => {
    warmupElapsed.current = 0
    sampleElapsed.current = 0
    sampleFrames.current = 0
    onFps(null)
  }, [active, onFps])

  useFrame((_, delta) => {
    if (!active) return

    if (!Number.isFinite(delta) || delta <= 0) {
      sampleElapsed.current = 0
      sampleFrames.current = 0
      return
    }

    // Même délai qu'avant : le canvas se stabilise trois secondes avant la mesure.
    if (warmupElapsed.current < 3) {
      warmupElapsed.current += delta
      return
    }

    sampleElapsed.current += delta
    sampleFrames.current += 1

    if (sampleElapsed.current < 1) return

    const fps = sampleFrames.current / sampleElapsed.current
    sampleElapsed.current = 0
    sampleFrames.current = 0
    onFps(Math.round(fps * 10) / 10)
  })

  return null
}

function selectInitialGhostSignalQuality(): GhostSignalQuality {
  const deviceMemory = (navigator as NavigatorWithDeviceMemory).deviceMemory

  return selectInitialQuality({
    viewportWidth: window.innerWidth,
    hardwareConcurrency: navigator.hardwareConcurrency,
    ...(deviceMemory === undefined ? {} : { deviceMemory }),
  })
}

/** Orchestre le canvas sans exposer Three au reste du site. */
export default function GhostSignalCanvas({
  active,
  host,
  onDiagnostics,
  onFailure,
  onLoading,
  onReady,
  onSignalChange,
  onSuspended,
}: GhostSignalCanvasProps) {
  const [quality] = useState<GhostSignalQuality>(selectInitialGhostSignalQuality)
  const [monitoring, setMonitoring] = useState(false)
  const pointer = useRef({ x: 0, y: 0 })
  const scroll = useRef(0)
  const profile = GHOST_SIGNAL_PROFILES[quality]
  const compact = typeof window !== 'undefined' && window.innerWidth < 768

  const handleReady = useCallback(() => {
    setMonitoring(true)
    onReady()
  }, [onReady])

  const handleLoading = useCallback(() => {
    setMonitoring(false)
    onLoading()
  }, [onLoading])

  const handleSuspended = useCallback(() => {
    setMonitoring(false)
    onSuspended()
  }, [onSuspended])

  const publishFps = useCallback((fps: number | null) => {
    onDiagnostics({ fps, profile: quality })
  }, [onDiagnostics, quality])

  useEffect(() => {
    onDiagnostics({ fps: null, profile: quality })
  }, [onDiagnostics, quality])

  useEffect(() => {
    if (!host) return undefined

    const scrollContainer = host.closest<HTMLElement>('[data-portfolio-scroll]')

    const updateScroll = () => {
      const bounds = host.getBoundingClientRect()
      scroll.current = Math.max(0, Math.min(1, -bounds.top / Math.max(1, bounds.height)))
    }

    updateScroll()
    scrollContainer?.addEventListener('scroll', updateScroll, { passive: true })

    if (!active) {
      pointer.current.x = 0
      pointer.current.y = 0
      return () => scrollContainer?.removeEventListener('scroll', updateScroll)
    }

    const handlePointerMove = (event: PointerEvent) => {
      const bounds = host.getBoundingClientRect()
      if (bounds.width <= 0 || bounds.height <= 0) return

      pointer.current.x = Math.max(
        -1,
        Math.min(1, ((event.clientX - bounds.left) / bounds.width) * 2 - 1),
      )
      pointer.current.y = Math.max(
        -1,
        Math.min(1, -(((event.clientY - bounds.top) / bounds.height) * 2 - 1)),
      )
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      scrollContainer?.removeEventListener('scroll', updateScroll)
    }
  }, [active, host])

  const camera = useMemo(() => ({
    fov: 38,
    near: 0.1,
    far: 16,
    position: [0, 0, 6.4] as const,
  }), [])

  return (
    <Canvas
      camera={camera}
      className="ghost-signal-canvas"
      dpr={[profile.dpr[0], profile.dpr[1]]}
      frameloop={active ? 'always' : 'never'}
      gl={{
        alpha: true,
        antialias: profile.id === 'high',
        powerPreference: profile.id === 'high' ? 'high-performance' : 'low-power',
      }}
      onCreated={({ gl }) => gl.setClearColor('#07080d', 0)}
      style={{ pointerEvents: 'none' }}
    >
      <GhostSignalScene
        compact={compact}
        onSignalChange={onSignalChange}
        pointer={pointer}
        profile={profile}
        scroll={scroll}
      />
      <GhostSignalFrameLifecycle
        onFailure={onFailure}
        onReady={handleReady}
        onRestoring={handleLoading}
        onSuspended={handleSuspended}
      />
      <GhostSignalFpsMeter
        active={active && monitoring}
        onFps={publishFps}
      />
    </Canvas>
  )
}
