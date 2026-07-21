import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react'

import {
  Canvas,
  useFrame,
} from '@react-three/fiber'

import {
  Html,
  Sparkles,
} from '@react-three/drei'

import {
  MathUtils,
} from 'three'

import type {
  Group,
  PointLight,
} from 'three'



/*
 * Contenu provisoire affiché sur l'écran de la télévision.
 *
 * Plus tard, ces écrans pourront être remplacés par de vraies pochettes,
 * photographies, vidéos ou interfaces musicales.
 */
const TV_SLIDES = [
  {
    id: 'signal',
    index: '01',
    title: 'SRO SIGNAL',
    text: 'Une fréquence attend derrière le verre.',
    accent: '#918bea',
    screen: '#17152b',
  },
  {
    id: 'archive',
    index: '02',
    title: 'ARCHIVE',
    text: 'Images, fragments et souvenirs à déposer ici.',
    accent: '#66d9d2',
    screen: '#102426',
  },
  {
    id: 'anomaly',
    index: '03',
    title: 'ANOMALIE',
    text: 'Cet écran deviendra une porte vers un autre objet.',
    accent: '#cf4b46',
    screen: '#2a1117',
  },
] as const

interface CameraRigProps {
  focused: boolean
  orbiting: boolean
  onOrbitComplet: () => void
}

/*
 * La caméra suit clairement la souris dans la vue générale.
 *
 * Quand la télévision est sélectionnée, elle avance vers l'écran et cesse
 * de suivre le pointeur. Les amplitudes sont volontairement visibles afin que
 * l'utilisateur comprenne immédiatement que la scène est interactive.
 */
function CameraRig({
  focused,
  orbiting,
  onOrbitComplet,
}: CameraRigProps) {
  const orbitProgressRef = useRef(0)

  useFrame(({ camera, pointer }, delta) => {
    /*
     * Lorsque l'orbite est active, ce bloc prend temporairement
     * le contrôle complet de la caméra.
     */
    if (orbiting) {
      /*
       * delta / 3 signifie que le tour dure environ trois secondes.
       */
      orbitProgressRef.current += delta / 3

      /*
       * La progression reste comprise entre 0 et 1.
       */
      const progress = Math.min(
        orbitProgressRef.current,
        1,
      )

      /*
       * Un cercle complet correspond à 2 × PI radians.
       */
      const angle =
        progress * Math.PI * 2

      const radius = 4.2

      /*
       * Centre autour duquel tourne la caméra.
       * Il correspond approximativement au centre de la télévision.
       */
      const telex = 0
      const teley = 1.3
      const telez = -0.25

      /*
       * sin et cos calculent une position circulaire.
       */
      camera.position.x =
        telex +
        Math.sin(angle) * radius

      camera.position.y =
        teley +
        Math.sin(angle * 2) * 0.25

      camera.position.z =
        telez +
        Math.cos(angle) * radius

      /*
       * Pendant tout le tour, la caméra regarde la télévision.
       */
      camera.lookAt(
        telex,
        teley,
        telez,
      )

      /*
       * Lorsque la progression atteint 1,
       * l'animation est terminée.
       */
      if (progress >= 1) {
        orbitProgressRef.current = 0
        onOrbitComplet()
      }

      /*
       * On quitte useFrame ici pour empêcher la caméra normale
       * de modifier également la position pendant l'orbite.
       */
      return
    }

    /*
     * Fonctionnement normal de la caméra.
     */
    const smoothing =
      1 - Math.exp(-4.2 * delta)

    const targetX = focused
      ? 0
      : pointer.x * 0.68

    const targetY = focused
      ? 1.42
      : 1.55 + pointer.y * 0.24

    const targetZ = focused
      ? 2.72
      : 6.2

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

    camera.position.z = MathUtils.lerp(
      camera.position.z,
      targetZ,
      smoothing,
    )

    const lookX = focused
      ? 0
      : pointer.x * 0.18

    const lookY = focused
      ? 1.32
      : 1.32 + pointer.y * 0.09

    camera.lookAt(
      lookX,
      lookY,
      -0.1,
    )
  })

  return null
}

/*
 * Pièce minimale construite uniquement avec des formes Three.js simples.
 *
 * Cette fondation permet de travailler l'ambiance et les interactions avant
 * d'acheter, créer ou importer un décor GLB définitif.
 */
function EmptyRoom() {
  return (
    <group>
      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
      >
        <planeGeometry args={[16, 16]} />

        <meshStandardMaterial
          color="#080910"
          metalness={0.15}
          roughness={0.82}
        />
      </mesh>

      <mesh
        receiveShadow
        position={[0, 2.7, -2.35]}
      >
        <boxGeometry args={[12, 5.4, 0.18]} />

        <meshStandardMaterial
          color="#0a0b13"
          metalness={0.06}
          roughness={0.92}
        />
      </mesh>

      <mesh position={[-5.9, 2.7, 1.5]}>
        <boxGeometry args={[0.18, 5.4, 8]} />

        <meshStandardMaterial
          color="#080910"
          roughness={0.95}
        />
      </mesh>

      <mesh position={[5.9, 2.7, 1.5]}>
        <boxGeometry args={[0.18, 5.4, 8]} />

        <meshStandardMaterial
          color="#080910"
          roughness={0.95}
        />
      </mesh>

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.012, 0.4]}
      >
        <ringGeometry
          args={[
            2.8,
            2.83,
            128,
          ]}
        />

        <meshBasicMaterial
          color="#6964c7"
          transparent
          opacity={0.22}
          toneMapped={false}
        />
      </mesh>

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.014, 0.4]}
      >
        <ringGeometry
          args={[
            4.2,
            4.215,
            128,
          ]}
        />

        <meshBasicMaterial
          color="#cf4b46"
          transparent
          opacity={0.28}
          toneMapped={false}
        />
      </mesh>

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.014, 0.4]}
      >
        <ringGeometry
          args={[
            2.2,
            2.215,
            128,
          ]}
        />

        <meshBasicMaterial
          color="#cf4b46"
          transparent
          opacity={0.68}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}

interface InteractiveTelevisionProps {
  focused: boolean
  onFocus: () => void
}

/*
 * Télévision provisoire construite avec des boîtes et un écran lumineux.
 *
 * Premier clic : la caméra s'approche.
 * Clics suivants : le diaporama change d'écran.
 */
function InteractiveTelevision({
  focused,
  onFocus,
}: InteractiveTelevisionProps) {
  const groupRef =
    useRef<Group | null>(null)

  const [hovered, setHovered] =
    useState(false)

  const [slideIndex, setSlideIndex] =
    useState(0)

  const slide =
    TV_SLIDES[slideIndex]

  /*
   * Le curseur est remis à sa valeur normale
   * lorsque le composant disparaît.
   */
  useEffect(() => {
    return () => {
      document.body.style.cursor =
        'default'
    }
  }, [])

  useFrame(({ clock }, delta) => {
    const group =
      groupRef.current

    if (!group) {
      return
    }

    const targetScale =
      hovered
        ? 1.055
        : 1

    const smoothing =
      1 - Math.exp(-7 * delta)

    const nextScale =
      MathUtils.lerp(
        group.scale.x,
        targetScale,
        smoothing,
      )

    group.scale.setScalar(
      nextScale,
    )

    group.rotation.y =
      Math.sin(
        clock.elapsedTime * 0.22,
      ) * 0.008
  })

  const handleClick = () => {
    if (!focused) {
      onFocus()
      return
    }

    setSlideIndex((current) => (
      current + 1
    ) % TV_SLIDES.length)
  }

  const handlePointerEnter = () => {
    setHovered(true)

    document.body.style.cursor =
      'pointer'
  }

  const handlePointerLeave = () => {
    setHovered(false)

    document.body.style.cursor =
      'default'
  }

  return (
    <group
      ref={groupRef}
      position={[0, 1.28, -0.25]}
    >
      <mesh
        castShadow
        receiveShadow
      >
        <boxGeometry
          args={[
            3.15,
            2.05,
            0.7,
          ]}
        />

        <meshStandardMaterial
          color="#151622"
          metalness={0.48}
          roughness={0.36}
        />
      </mesh>

      <mesh
        position={[
          0,
          0.08,
          0.372,
        ]}
      >
        <planeGeometry
          args={[
            2.62,
            1.47,
          ]}
        />

        <meshStandardMaterial
          color={slide.screen}
          emissive={slide.accent}
          emissiveIntensity={
            focused
              ? 0.52
              : hovered
                ? 0.4
                : 0.25
          }
          metalness={0.04}
          roughness={0.28}
          toneMapped={false}
        />
      </mesh>

      {/*
       * Zone invisible placée devant toute la télévision.
       * Elle garantit un clic fiable même si le texte HTML recouvre visuellement
       * l'écran ou si l'utilisateur clique près des bords.
       */}
      <mesh
        position={[
          0,
          0.02,
          0.46,
        ]}
        onClick={(event) => {
          event.stopPropagation()
          handleClick()
        }}
        onPointerEnter={(event) => {
          event.stopPropagation()
          handlePointerEnter()
        }}
        onPointerLeave={
          handlePointerLeave
        }
      >
        <planeGeometry
          args={[
            3.05,
            1.95,
          ]}
        />

        <meshBasicMaterial
          transparent
          opacity={0}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      <Html
        center
        transform
        distanceFactor={2.25}
        position={[
          0,
          0.08,
          0.39,
        ]}
        pointerEvents="none"
        style={{
          '--sro-slide-accent':
            slide.accent,
          pointerEvents: 'none',
        } as CSSProperties}
      >
        <div
          aria-hidden="true"
          className="sro-world-tv-slide"
        >
          <span>
            {slide.index} / 03
          </span>

          <strong>
            {slide.title}
          </strong>

          <p>
            {slide.text}
          </p>

          <small>
            {focused
              ? 'CLIQUEZ POUR CONTINUER'
              : 'CLIQUEZ POUR APPROCHER'}
          </small>
        </div>
      </Html>

      <mesh
        position={[
          -1.08,
          -0.86,
          0.39,
        ]}
      >
        <sphereGeometry
          args={[
            0.045,
            20,
            20,
          ]}
        />

        <meshBasicMaterial
          color={slide.accent}
          toneMapped={false}
        />
      </mesh>

      <mesh
        position={[
          -1.05,
          -1.38,
          -0.05,
        ]}
      >
        <boxGeometry
          args={[
            0.28,
            0.72,
            0.28,
          ]}
        />

        <meshStandardMaterial
          color="#0b0c13"
          metalness={0.5}
          roughness={0.5}
        />
      </mesh>

      <mesh
        position={[
          1.05,
          -1.38,
          -0.05,
        ]}
      >
        <boxGeometry
          args={[
            0.28,
            0.72,
            0.28,
          ]}
        />

        <meshStandardMaterial
          color="#0b0c13"
          metalness={0.5}
          roughness={0.5}
        />
      </mesh>
    </group>
  )
}
function AnimatedPointLight() {
  const lightRef =
    useRef<PointLight | null>(null)

  useFrame(({ clock }) => {
    const light = lightRef.current

    if (!light) {
      return
    }

    const time =
      clock.elapsedTime

    /*
     * La lumière parcourt continuellement
     * le cercle des couleurs.
     */
    const hue =
      (time * 0.08) % 1

    light.color.setHSL(
      hue,
      0.7,
      0.55,
    )

    /*
     * La lumière animée reste du côté droit.
     * Elle tourne autour de sa position de base x = 3.4.
     */
    light.position.x =
      3.4 +
      Math.cos(time * 0.7) * 1.8

    /*
     * Petit mouvement vertical.
     */
    light.position.y =
      0.8 +
      Math.sin(time * 0.9) * 0.45

    /*
     * Mouvement en profondeur.
     */
    light.position.z =
      0.5 +
      Math.sin(time * 0.7) * 1.3
  })

  return (
    <pointLight
      ref={lightRef}
      position={[
        3.4,
        0.8,
        0.5,
      ]}
      intensity={8}
      distance={6}
      color="#cf4b46"
    />
  )
}

/*
 * Canvas complet de la première version du monde SRO.
 */
export function SroWorldCanvas() {
  const [focused, setFocused] =
    useState(false)

  const [orbiting, setOrbiting] =
    useState(false)

  /*
   * Cet effet branche la touche O sur l'animation orbitale.
   */
  useEffect(() => {
    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (
        event.key.toLowerCase() ===
        'o'
      ) {
        setOrbiting(true)
      }
    }

    /*
     * On indique au navigateur quelle fonction appeler
     * lorsqu'une touche est pressée.
     */
    window.addEventListener(
      'keydown',
      handleKeyDown,
    )

    /*
     * Lorsque le composant disparaît, on retire l'événement.
     * Cela évite de conserver plusieurs écouteurs identiques.
     */
    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown,
      )
    }
  }, [])

  return (
    <Canvas
      shadows
      camera={{
        position: [
          0,
          1.55,
          6.2,
        ],
        fov: 62,
        near: 0.1,
        far: 60,
      }}
      dpr={[1, 1.5]}
      gl={{
        alpha: false,
        antialias: true,
        powerPreference:
          'high-performance',
      }}
      onPointerMissed={() => {
        setFocused(false)

        document.body.style.cursor =
          'default'
      }}
    >
      <color
        attach="background"
        args={['#05060a']}
      />

      <fog
        attach="fog"
        args={[
          '#05060a',
          7,
          20,
        ]}
      />

      <CameraRig
        focused={focused}
        orbiting={orbiting}
        onOrbitComplet={() => {
          setOrbiting(false)
        }}
      />

      <hemisphereLight
        intensity={0.32}
        color="#8d89d8"
        groundColor="#05060a"
      />

      <spotLight
        castShadow
        position={[
          2.8,
          5.6,
          4.5,
        ]}
        intensity={35}
        distance={18}
        angle={0.48}
        penumbra={1}
        color="#6964c7"
        shadow-mapSize={[
          512,
          512,
        ]}
      />

      <pointLight
        position={[
          -3.6,
          1.8,
          2,
        ]}
        intensity={9}
        distance={8}
        color="#5f8fa0"
      />

      <AnimatedPointLight />
      <pointLight
        position={[
          -3.4,
          0.8,
          0.5,
        ]}
        intensity={150}
        distance={6}
        color="#3419af"
      />

      <EmptyRoom />

      <InteractiveTelevision
        focused={focused}
        onFocus={() => {
          setFocused(true)
        }}
      />

      <Sparkles
        count={84}
        scale={[
          10,
          5,
          8,
        ]}
        size={2.3}
        speed={0.12}
        opacity={0.84}
        color="#362bd4"
        noise={[
          0.35,
          0.25,
          0.35,
        ]}
      />

      <Sparkles
        count={84}
        scale={[
          10,
          5,
          8,
        ]}
        size={2.3}
        speed={0.12}
        opacity={0.34}
        color="#0f09cc"
        noise={[
          0.35,
          0.25,
          0.35,
        ]}
      />
    </Canvas>
  )
}

export default SroWorldCanvas

