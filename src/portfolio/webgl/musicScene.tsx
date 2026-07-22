import { lazy, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'

const MusicModel = lazy(() =>
  import('./MusicModel').then(({ MusicModel: Model }) => ({ default: Model })),
)

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