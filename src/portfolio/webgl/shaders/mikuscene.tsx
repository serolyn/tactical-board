import {
  Suspense,
  useRef,
} from 'react'

import {
  Canvas,
  useFrame,
} from '@react-three/fiber'

import {
  ContactShadows,
  Float,
  Html,
  Sparkles,
} from '@react-three/drei'

import {
  AdditiveBlending,
  MathUtils,
  Vector3,
} from 'three'

import type { Group, Mesh, } from 'three'

import MikuModel from './mikumodel'

import '@/portfolio/styles/miku.css'

/*
 * Valeurs principales à modifier pour ajuster la composition.
 */
const MODEL_POSITION: [number, number, number] = [
  0,
  -0.90,
  0,
]

const MODEL_SCALE = 1

function TrainingSignal(){ //fonctionm de reference 

  const signalRef = useRef<Mesh | null>(null,) //j commence par mettre la ref dans une constante une fonction qui prends comme arg une fonction et qui return un mesh

  useFrame(({clock,}) => { //use frame sactualise chaque frame
    const signal = signalRef.current // current sera la mesh courante si elle existe 
    if(!signal){
      return
    }

    const time = clock.elapsedTime //donne le temps qui est passe a chaque frame

    //signal.position.x = 1+ Math.cos(time)   aller et retour sur l'axe x
    signal.rotateOnAxis (new Vector3(0,1,0), 0.01) //rotation sur l'axe y avec un angle de 0.01 radian par frame
    signal.rotateOnAxis (new Vector3(1,0,0), 0.01) //rotation sur l'axe x avec un angle de 0.01 radian par frame
    


  }) //fin de la fonction en argument

  return ( //return un mesh avec une torus geometry et un material basique
    <mesh
      ref = {signalRef}
      position = {[2,1,0]}
      
    >
      <torusGeometry args={[0.2, 0.05, 16, 100]} />

      <meshBasicMaterial color = "#5718e9" reflectivity = {0.5} transparent = {true}
       opacity = {0.5}
      />
    </mesh>
  )
}
/*
 * Déplace très légèrement la caméra selon la souris.
 *
 * Le mouvement reste volontairement faible pour éviter l'effet
 * "modèle 3D qui essaie de s'échapper de la page".
 */
function CameraRig({entering,}: MikuThreeSceneProps) {

    //console.log('CameraRig entering :', entering)
  useFrame(
    (
      {
        camera,
        pointer,
      },
      delta,
    ) => {
      const smoothing =
        1 - Math.exp(-3.5 * delta)

      const targetX = entering         
      ? 0
      : pointer.x * 0.34
      
      const targetY = entering
      ? 0
      : 0.1 + pointer.y * 0.18

      const targetZ = entering
      ?  1.4
      : 6.4

      
        

      camera.position.x = MathUtils.lerp(
        camera.position.x,
        targetX,
        smoothing,
      )

      camera.position.y = MathUtils.lerp(
        camera.position.y,
        targetY,
        smoothing,
      )

      camera.position.z = MathUtils.lerp(camera.position.z, targetZ, smoothing)

      camera.lookAt(0, 0, 0)
    },
  )

  return null
}

/*
 * Anime doucement le modèle selon la souris.
 *
 * Float ajoute un mouvement vertical indépendant,
 * tandis que ce composant contrôle la rotation générale.
 */
function AnimatedMiku() {
  const groupRef = useRef<Group | null>(null)

  useFrame(
    (
      {
        clock,
        pointer,
      },
      delta,
    ) => {
      const group = groupRef.current

      if (!group) {
        return
      }

      const smoothing =
        1 - Math.exp(-4 * delta)

      const targetRotationX =
        -pointer.y * 0.055

      const targetRotationY =
        pointer.x * 0.16

      group.rotation.x = MathUtils.lerp(
        group.rotation.x,
        targetRotationX,
        smoothing,
      )

      group.rotation.y = MathUtils.lerp(
        group.rotation.y,
        targetRotationY,
        smoothing,
      )

      /*
       * Une oscillation presque imperceptible empêche
       * la scène de paraître totalement figée.
       */
      group.rotation.z =
        Math.sin(
          clock.elapsedTime * 0.42,
        ) * 0.008
    },
  )

  return (
    <group
      ref={groupRef}
      position={MODEL_POSITION}
      scale={MODEL_SCALE}
    >
      <Float
        speed={1.15}
        rotationIntensity={0.045}
        floatIntensity={0.22}
        floatingRange={[-0.08, 0.1]}
      >
        <MikuModel />
      </Float>
    </group>
  )
}

/*
 * Anneaux lumineux placés derrière le personnage.
 *
 * Ils tournent lentement à des vitesses différentes pour créer
 * une sorte d'interface céleste ou de sceau numérique.
 */
function SpectralHalo() {
  const groupRef = useRef<Group | null>(null)

  useFrame(({ clock }, delta) => {
    const group = groupRef.current

    if (!group) {
      return
    }

    group.rotation.z += delta * -0.125

    group.position.y =
      Math.sin(
        clock.elapsedTime * 0.2,
      ) * 0.025
  })

  return (
    <group
      ref={groupRef}
      position={[0, 0.05, -1.35]}
    >
      {/*
       * Disque sombre central.
       */}
      <mesh position={[0, 0, -0.04]}>
        <circleGeometry args={[2.5, 128]} />

        <meshBasicMaterial
          color="#171422"
          transparent
          opacity={0.33}
          depthWrite={false}
        />
      </mesh>

      {/*
       * Anneau violet principal.
       */}
      <mesh>
        <ringGeometry
          args={[
            2.08,
            2.105,
            160,
          ]}
        />

        <meshBasicMaterial
          color="#8580e8"
          transparent
          opacity={0.48}
          depthWrite={false}
          toneMapped={false}
          blending={AdditiveBlending}
        />
      </mesh>
        {
            // anneau horizontale
            }
      <mesh position={[0, 0, -0.04]} rotation={[2, 2, 3.55]}>
        <ringGeometry
          args={[
            2.08,
            2.105,
            160,
          ]}
        />

        <meshBasicMaterial
          color="#80e889"
          transparent
          opacity={0.48}
          depthWrite={false}
          toneMapped={false}
          blending={AdditiveBlending}
        />
      </mesh>

      {/*
       * Anneau extérieur très discret.
       */}
      <mesh
        rotation={[0, 0, 0.55]}
        scale={1.2}
      >
        <ringGeometry
          args={[
            2.08,
            2.088,
            160,
          ]}
        />

        <meshBasicMaterial
          color="#6964c7"
          transparent
          opacity={0.2}
          depthWrite={false}
          toneMapped={false}
          blending={AdditiveBlending}
        />
      </mesh>

      {/*
       * Cercles incomplets simulés avec des arcs.
       */}
      <mesh rotation={[0, 0, -0.35]}>
        <ringGeometry
          args={[
            1.78,
            1.795,
            128,
            1,
            0,
            Math.PI * 1.35,
          ]}
        />

        <meshBasicMaterial
          color="#aaa7ff"
          transparent
          opacity={0.22}
          depthWrite={false}
          toneMapped={false}
          blending={AdditiveBlending}
        />
      </mesh>

      <mesh
        rotation={[0, 0, 1.6]}
        scale={0.84}
      >
        <ringGeometry
          args={[
            1.78,
            1.79,
            128,
            1,
            0,
            Math.PI * 0.72,
          ]}
        />

        <meshBasicMaterial
          color="#cf4b46"
          transparent
          opacity={0.5}
          depthWrite={false}
          toneMapped={false}
          blending={AdditiveBlending}
        />
      </mesh>

      {/*
       * Petite anomalie rouge excentrée.
       */}
      <mesh
        position={[1.55, -0.82, 0.04]}
        scale={0.15}
      >
        <ringGeometry
          args={[
            0.8,
            0.88,
            64,
          ]}
        />

        <meshBasicMaterial
          color="#ff4b45"
          transparent
          opacity={0.78}
          depthWrite={false}
          toneMapped={false}
          blending={AdditiveBlending}
        />
      </mesh>
    </group>
  )
}

/*
 * Quelques particules verticales plus géométriques.
 */
function SignalFragments() {
  const groupRef = useRef<Group | null>(null)

  useFrame(({ clock }) => {
    const group = groupRef.current

    if (!group) {
      return
    }

    group.rotation.z =
      Math.sin(
        clock.elapsedTime * 0.18,
      ) * 0.967
  })

  return (
    <group
      ref={groupRef}
      position={[0, 0, -0.7]}
    >
      <mesh
        position={[-2.35, 0.8, 0]}
        rotation={[0, 0, 0.15]}
      >
        <planeGeometry args={[0.012, 0.8]} />

        <meshBasicMaterial
          color="#8c87ef"
          transparent
          opacity={0.28}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      <mesh
        position={[2.05, -0.6, 0]}
        rotation={[0, 0, -0.1]}
      >
        <planeGeometry args={[0.01, 0.48]} />

        <meshBasicMaterial
          color="#cf4b46"
          transparent
          opacity={0.38}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      <mesh
        position={[1.85, 1.55, 0]}
        rotation={[0, 0, 1.15]}
      >
        <planeGeometry args={[0.008, 0.3]} />

        <meshBasicMaterial
          color="#b9b6ff"
          transparent
          opacity={0.23}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}

function LoadingModel() {
  return (
    <Html center>
      <div className="music-glb-loading">
        <span className="music-glb-loading-signal" />

        Chargement du signal…
      </div>
    </Html>
  )
}

function SceneContent({entering,} : MikuThreeSceneProps) { 

  return (
    <>
      <CameraRig entering = {entering}/>

      {/*
       * Brume légère au fond de la scène.
       */}
      <fog
        attach="fog"
        args={[
          '#0b0911',
          7,
          14,
        ]}
      />

      {/*
       * Lumière générale froide très faible.
       */}
      <hemisphereLight
        intensity={0.7}
        color="#b7b4e8"
        groundColor="#120f1b"
      />

      {/*
       * Lumière principale violette.
       */}
      <spotLight
        position={[3.6, 4.5, 5]}
        intensity={55}
        distance={14}
        angle={0.48}
        penumbra={1}
        color="#918bea"
      />

      {/*
       * Contre-jour bleu/violet.
       */}
      <pointLight
        position={[-3.8, 1.3, 2.5]}
        intensity={22}
        distance={10}
        color="#5550b8"
      />

      {/*
       * Anomalie rouge, volontairement plus faible.
       */}
      <pointLight
        position={[2.6, -1.2, 2]}
        intensity={11}
        distance={6}
        color="#cf4b46"
      />

      <SpectralHalo />

      <SignalFragments />
      <TrainingSignal />

      {/*
       * Particules violettes principales.
       */}
      <Sparkles
        count={75}
        scale={[8, 5, 4]}
        size={1.5}
        speed={0.24}
        opacity={0.45}
        color="#8782e8"
        noise={[1, 0.65, 1]}
      />

      {/*
       * Quelques particules rouges seulement.
       */}
      <Sparkles
        count={8}
        scale={[5, 3.5, 3]}
        size={2}
        speed={0.12}
        opacity={0.55}
        color="#cf4b46"
        noise={[0.6, 0.35, 0.6]}
      />

      <Suspense fallback={<LoadingModel />}>
        <AnimatedMiku />

        <ContactShadows
          position={[0, -1.85, 0]}
          scale={6}
          opacity={0.48}
          blur={2.8}
          far={4}
          resolution={256}
          color="#050409"
          frames={60}
        />
      </Suspense>
    </>
  )
}
interface MikuThreeSceneProps {
  entering: boolean
}
export function MikuThreeScene({entering,} : MikuThreeSceneProps) {
  return (
    <section
      className="music-glb-scene"
      aria-label="Scène tridimensionnelle interactive de SRO"
    >
      <div
        className="music-glb-scene__vignette"
        aria-hidden="true"
      />

      <div
        className="music-glb-scene__grain"
        aria-hidden="true"
      />

      <Canvas
        shadows
        camera={{
          position: [0, 0.1, 6.4],
          fov: entering
          ? MathUtils.lerp(60,100,75)
          : 60,
          near: 0.1,
          far: 100,
        }}
        dpr={[1, 1.5]}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance',
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(
            '#000000',
            0,
          )
        }}
      >
        <SceneContent entering={entering} />
      </Canvas>
    </section>
  )
}

export default MikuThreeScene