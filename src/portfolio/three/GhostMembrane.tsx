import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, type MutableRefObject } from 'react'
import type { BufferGeometry, Vector3Tuple } from 'three'
import {
  createGhostSignalMaterial,
  type GhostSignalMaterialMode,
} from './GhostSignalMaterial'

interface GhostMembraneProps {
  readonly geometry: BufferGeometry
  readonly highQuality: boolean
  readonly layer: number
  readonly mode: GhostSignalMaterialMode
  readonly opacity: number
  readonly pointer: MutableRefObject<{ x: number; y: number }>
  readonly position?: Vector3Tuple | readonly [number, number, number]
  readonly redSignal: MutableRefObject<number>
  readonly renderOrder: number
  readonly rotation?: Vector3Tuple | readonly [number, number, number]
  readonly scale?: number | Vector3Tuple | readonly [number, number, number]
  readonly scroll: MutableRefObject<number>
}
export function GhostMembrane({
  geometry,
  highQuality,
  layer,
  mode,
  opacity,
  pointer,
  position,
  redSignal,
  renderOrder,
  rotation,
  scale,
  scroll,
}: GhostMembraneProps) {
  const material = useMemo(
    () => createGhostSignalMaterial({ mode, layer, opacity, highQuality }),
    [highQuality, layer, mode, opacity],
  )

  useEffect(() => () => material.dispose(), [material])

  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.elapsedTime
    material.uniforms.uPointer.value.set(pointer.current.x, pointer.current.y)
    material.uniforms.uSignal.value = redSignal.current
    material.uniforms.uScroll.value = scroll.current
  })

  return (
    <mesh
      geometry={geometry}
      material={material}
      position={position}
      renderOrder={renderOrder}
      rotation={rotation}
      scale={scale}
    />
  )
}
