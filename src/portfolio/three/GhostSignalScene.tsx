import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import {
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  MathUtils,
  PlaneGeometry,
} from 'three'
import { GhostMembrane } from './GhostMembrane'
import {
  GHOST_SIGNAL_PROFILES,
  type GhostSignalQualityProfile,
} from './qualityProfile'
import { getGhostSignalIntensity } from './signalCycle'

interface GhostSignalSceneProps {
  readonly compact: boolean
  readonly onSignalChange: (active: boolean) => void
  readonly pointer: MutableRefObject<{ x: number; y: number }>
  readonly profile: GhostSignalQualityProfile
}

interface MembraneLayer {
  readonly opacity: number
  readonly position: readonly [number, number, number]
  readonly rotation: number
  readonly scale: number
}

const HIGH_LAYERS: readonly MembraneLayer[] = [
  { opacity: 1, position: [0.38, 0.04, 0], rotation: 0.028, scale: 1 },
  { opacity: 0.58, position: [-0.02, 0.1, -0.46], rotation: -0.07, scale: 0.94 },
  { opacity: 0.36, position: [-0.35, -0.02, -0.88], rotation: 0.095, scale: 0.87 },
]

const LOW_LAYERS = HIGH_LAYERS.slice(0, GHOST_SIGNAL_PROFILES.low.layers)

function createAtmosphericLineGeometry() {
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute([
    -2.8, 1.55, -0.62, 2.7, 1.3, -0.62,
    -2.3, 0.24, -0.38, 2.95, -0.12, -0.38,
    -2.65, -1.42, -0.74, 2.4, -1.16, -0.74,
  ], 3))
  return geometry
}

export function GhostSignalScene({
  compact,
  onSignalChange,
  pointer,
  profile,
}: GhostSignalSceneProps) {
  const group = useRef<Group>(null)
  const redSignal = useRef(0)
  const signalActive = useRef(false)
  const signalChangeRef = useRef(onSignalChange)
  const geometry = useMemo(
    () => new PlaneGeometry(2.72, 4.45, profile.segments[0], profile.segments[1]),
    [profile],
  )
  const lineGeometry = useMemo(createAtmosphericLineGeometry, [])
  const lineMaterial = useMemo(
    () => new LineBasicMaterial({ color: '#8d91c1', transparent: true, opacity: 0.13 }),
    [],
  )
  const layers = profile.id === 'high' ? HIGH_LAYERS : LOW_LAYERS

  signalChangeRef.current = onSignalChange

  useEffect(() => () => {
    geometry.dispose()
    lineGeometry.dispose()
    lineMaterial.dispose()
  }, [geometry, lineGeometry, lineMaterial])

  useEffect(() => () => signalChangeRef.current(false), [])

  useFrame(({ clock }, delta) => {
    const currentGroup = group.current
    if (!currentGroup) return

    const elapsed = clock.elapsedTime
    const intensity = getGhostSignalIntensity(elapsed)
    redSignal.current = intensity
    const nextSignalActive = intensity > 0.12
    if (nextSignalActive !== signalActive.current) {
      signalActive.current = nextSignalActive
      signalChangeRef.current(nextSignalActive)
    }

    const targetRotationX = pointer.current.y * -0.045
    const targetRotationY = pointer.current.x * 0.075
    const targetPositionX = (compact ? 0 : 0.42) + pointer.current.x * 0.12
    const targetPositionY = (compact ? 0.5 : 0) + pointer.current.y * 0.07

    currentGroup.rotation.x = MathUtils.damp(currentGroup.rotation.x, targetRotationX, 2.2, delta)
    currentGroup.rotation.y = MathUtils.damp(currentGroup.rotation.y, targetRotationY, 2.2, delta)
    currentGroup.position.x = MathUtils.damp(currentGroup.position.x, targetPositionX, 1.8, delta)
    currentGroup.position.y = MathUtils.damp(currentGroup.position.y, targetPositionY, 1.8, delta)
  })

  return (
    <>
      <fog attach="fog" args={['#07080d', 4.6, 8.4]} />
      <group ref={group} scale={compact ? 0.78 : 1}>
        {layers.map((layer, index) => (
          <GhostMembrane
            geometry={geometry}
            highQuality={profile.id === 'high'}
            key={index}
            layer={index}
            opacity={layer.opacity}
            pointer={pointer}
            position={layer.position}
            redSignal={redSignal}
            rotation={layer.rotation}
            scale={layer.scale}
          />
        ))}
        {profile.atmosphericLines ? (
          <lineSegments
            geometry={lineGeometry}
            material={lineMaterial}
            position={[0.25, 0, -0.26]}
            renderOrder={2}
          />
        ) : null}
      </group>
    </>
  )
}
