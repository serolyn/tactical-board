import { Center, useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import React from 'react'
import { useRef } from 'react'
import type { Group } from 'three'
import cloudsModelUrl from '../../assets/effects/music/clouds.glb'

export function MusicModel(props: React.ComponentProps<'group'>) {
  const { scene } = useGLTF(cloudsModelUrl)
  const cloudRef = useRef<Group>(null)

  useFrame(({ clock }) => {
    const cloud = cloudRef.current
    if (!cloud) {
      return
    }

    const elapsed = clock.getElapsedTime()
    cloud.rotation.x = Math.sin(elapsed * 0.45) * 0.08
    cloud.rotation.y = elapsed * 0.18
  })

  return (
    <group {...props}>
      <group ref={cloudRef} scale={0.008}>
        <Center>
          <primitive object={scene} />
        </Center>
      </group>
    </group>
  )
}

useGLTF.preload(cloudsModelUrl)