import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, type MutableRefObject } from 'react'
import type { BufferGeometry, Vector2Tuple } from 'three'
import { createGhostSignalMaterial } from './GhostSignalMaterial'

interface GhostMembraneProps {
  readonly geometry: BufferGeometry
  readonly highQuality: boolean
  readonly layer: number
  readonly opacity: number
  readonly pointer: MutableRefObject<{ x: number; y: number }>
  readonly position: Vector2Tuple | readonly [number, number, number]
  readonly redSignal: MutableRefObject<number>
  readonly rotation: number
  readonly scale: number
}
export function GhostMembrane({
  geometry,
  highQuality,
  layer,
  opacity,
  pointer,
  position,
  redSignal,
  rotation,
  scale,
}: GhostMembraneProps) {
  const material = useMemo(
    () => createGhostSignalMaterial({ layer, opacity, highQuality }),
    [highQuality, layer, opacity],
  )

  useEffect(() => () => material.dispose(), [material])

  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.elapsedTime
    material.uniforms.uPointer.value.set(pointer.current.x, pointer.current.y)
    material.uniforms.uSignal.value = redSignal.current
  })

  return (
    <mesh
      geometry={geometry}
      material={material}
      position={position}
      renderOrder={10 + layer}
      rotation={[0, rotation, rotation * -0.22]}
      scale={scale}
    />
  )
}
