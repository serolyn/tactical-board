/**
 * @packageDocumentation
 * Effets WebGL du portfolio.
 *
 * Ce dossier contient la partie visuelle avancée du hero: shaders, scènes et
 * fallback. Si WebGL n'est pas disponible, ces fichiers expliquent aussi quoi
 * faire à la place.
 */

import { lazy, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'

const MusicModel = lazy(() =>
  import('./MusicModel').then(({ MusicModel: Model }) => ({ default: Model })),
)
/**
 * Cette fonction intervient sur le sujet “can Render Music Scene” dans portfolio.
 *
 * Fichier: src/portfolio/webgl/musicScene.tsx
 * Si tu lis ce fichier pour apprendre, regarde d’abord canRenderMusicScene dans musicScene.tsx.
 */


function canRenderMusicScene() {
  if (
    typeof window === 'undefined'
    || typeof WebGLRenderingContext === 'undefined'
    || typeof ResizeObserver === 'undefined'
  ) {
    return false
  }

  const canvas = document.createElement('canvas')
  return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
}
/**
 * Cette fonction intervient sur le sujet “music Scene” dans portfolio.
 *
 * Fichier: src/portfolio/webgl/musicScene.tsx
 * Si tu lis ce fichier pour apprendre, regarde d’abord MusicScene dans musicScene.tsx.
 */


export default function MusicScene() {
  if (!canRenderMusicScene()) {
    return <div aria-hidden="true" className="music-scene" />
  }

  return (
    <div className="music-scene">
      <Canvas
        camera={{
          position: [0, 0, 5],
          fov: 35,
        }}
        dpr={[1, 1.5]}
        gl={{
          alpha: true,
          antialias: true,
        }}
      >
        {/* Éclairage général */}
        <ambientLight intensity={0.6} />

        {/* Lumière bleu-violet principale */}
        <directionalLight
          position={[3, 4, 5]}
          intensity={2.5}
          color="#6964c7"
        />

        {/* Petite lumière rouge */}
        <pointLight
          position={[-2, 1, 2]}
          intensity={12}
          distance={2}
          color="#ff0800"
        />

        <Suspense fallback={null}>
          <MusicModel
            scale={1}
            position={[0, 0, 0]}
            rotation={[0, 0, 0]}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}