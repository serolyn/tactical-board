/**
 * @packageDocumentation
 * Effets WebGL du portfolio.
 *
 * Ce dossier contient la partie visuelle avancée du hero: shaders, scènes et
 * fallback. Si WebGL n'est pas disponible, ces fichiers expliquent aussi quoi
 * faire à la place.
 */

import { Center, useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import React from 'react'
import { useRef } from 'react'
import type { Group } from 'three'
import cloudsModelUrl from '../../assets/effects/music/clouds.glb'
/**
 * Cette fonction intervient sur le sujet “music Model” dans portfolio.
 *
 * Fichier: src/portfolio/webgl/MusicModel.tsx
 * Si tu lis ce fichier pour apprendre, regarde d’abord MusicModel dans MusicModel.tsx.
 */


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