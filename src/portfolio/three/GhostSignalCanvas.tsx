import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { WebGLRenderer } from 'three'
import { bindWebGLContextLifecycle } from './contextLifecycle'
import { GhostSignalScene } from './GhostSignalScene'
import {
  GHOST_SIGNAL_PROFILES,
  degradeQuality,
  selectInitialQuality,
  type GhostSignalQuality,
} from './qualityProfile'

export interface GhostSignalCanvasProps {
  readonly active: boolean
  readonly host: HTMLElement | null
  readonly onFailure: () => void
  readonly onReady: () => void
  readonly onSignalChange: (active: boolean) => void
  readonly onSuspended: () => void
}

interface NavigatorWithDeviceMemory extends Navigator {
  readonly deviceMemory?: number
}

interface FrameLifecycleProps {
  readonly onFailure: () => void
  readonly onReady: () => void
  readonly onSuspended: () => void
}

function FrameLifecycle({ onFailure, onReady, onSuspended }: FrameLifecycleProps) {
  const { gl } = useThree()
  const ready = useRef(false)
  const readyFrame = useRef<number | null>(null)

  useEffect(() => {
    const renderer = gl as WebGLRenderer
    const previousShaderError = renderer.debug.onShaderError
    renderer.debug.onShaderError = () => onFailure()

    const cleanupContext = bindWebGLContextLifecycle(renderer.domElement, {
      onLost: () => {
        ready.current = false
        onSuspended()
      },
      onRestored: () => {
        ready.current = false
      },
      onPermanentFailure: onFailure,
    })

    return () => {
      if (readyFrame.current !== null) cancelAnimationFrame(readyFrame.current)
      renderer.debug.onShaderError = previousShaderError
      cleanupContext()
    }
  }, [gl, onFailure, onSuspended])

  useFrame(() => {
    if (ready.current || readyFrame.current !== null) return
    readyFrame.current = requestAnimationFrame(() => {
      readyFrame.current = null
      const context = gl.getContext()
      if (context.isContextLost()) return
      if (context.getError() !== context.NO_ERROR) {
        onFailure()
        return
      }
      ready.current = true
      onReady()
    })
  })

  return null
}

function initialQuality(): Exclude<GhostSignalQuality, 'fallback'> {
  const deviceMemory = (navigator as NavigatorWithDeviceMemory).deviceMemory
  return selectInitialQuality({
    viewportWidth: window.innerWidth,
    hardwareConcurrency: navigator.hardwareConcurrency,
    ...(deviceMemory === undefined ? {} : { deviceMemory }),
  })
}

export default function GhostSignalCanvas({
  active,
  host,
  onFailure,
  onReady,
  onSignalChange,
  onSuspended,
}: GhostSignalCanvasProps) {
  const [quality, setQuality] = useState<GhostSignalQuality>(initialQuality)
  const pointer = useRef({ x: 0, y: 0 })
  const profile = quality === 'fallback' ? null : GHOST_SIGNAL_PROFILES[quality]
  const compact = typeof window !== 'undefined' && window.innerWidth < 768

  const fail = useCallback(() => {
    setQuality('fallback')
  }, [])

  const decline = useCallback(() => {
    setQuality((current) => degradeQuality(current))
  }, [])

  useEffect(() => {
    if (quality !== 'fallback') return
    onSignalChange(false)
    onFailure()
  }, [onFailure, onSignalChange, quality])

  useEffect(() => {
    if (!active || !host) {
      pointer.current.x = 0
      pointer.current.y = 0
      return undefined
    }

    const handlePointerMove = (event: PointerEvent) => {
      const bounds = host.getBoundingClientRect()
      if (bounds.width <= 0 || bounds.height <= 0) return
      pointer.current.x = Math.max(-1, Math.min(1, ((event.clientX - bounds.left) / bounds.width) * 2 - 1))
      pointer.current.y = Math.max(-1, Math.min(1, -(((event.clientY - bounds.top) / bounds.height) * 2 - 1)))
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    return () => window.removeEventListener('pointermove', handlePointerMove)
  }, [active, host])

  const camera = useMemo(() => ({ fov: 36, near: 0.1, far: 14, position: [0, 0, 5.6] as const }), [])

  if (!profile) return null

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
      <PerformanceMonitor
        bounds={(refreshRate) => refreshRate > 90 ? [50, 85] : [44, 58]}
        flipflops={2}
        onDecline={decline}
        onFallback={fail}
      >
        <GhostSignalScene
          compact={compact}
          onSignalChange={onSignalChange}
          pointer={pointer}
          profile={profile}
        />
        <FrameLifecycle
          onFailure={fail}
          onReady={onReady}
          onSuspended={onSuspended}
        />
      </PerformanceMonitor>
    </Canvas>
  )
}
