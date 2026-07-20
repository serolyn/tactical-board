import { useFrame } from '@react-three/fiber'
import {
  useEffect,
  useMemo,
  useRef,
  type MutableRefObject,
} from 'react'
import {
  BufferGeometry,
  Color,
  AdditiveBlending,
  CylinderGeometry,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  LineBasicMaterial,
  MathUtils,
  MeshBasicMaterial,
  Object3D,
  TetrahedronGeometry,
} from 'three'

import { GhostMembrane } from './GhostMembrane'
import type { GhostSignalQualityProfile } from './ghostSignalQualityProfile'
import { getGhostSignalIntensity } from './ghostSignalCycle'

interface GhostSignalSceneProps {
  readonly compact: boolean
  readonly onSignalChange: (active: boolean) => void
  readonly pointer: MutableRefObject<{ x: number; y: number }>
  readonly profile: GhostSignalQualityProfile
  readonly scroll: MutableRefObject<number>
}

/** Configuration d’un écho situé derrière la sculpture principale. */
interface EchoLayer {
  readonly opacity: number
  readonly position: readonly [number, number, number]
  readonly rotation: readonly [number, number, number]
  readonly scale: number
}

/** Position, rotation et taille d’un fragment flottant. */
interface FragmentDescriptor {
  readonly position: readonly [number, number, number]
  readonly rotation: readonly [number, number, number]
  readonly scale: readonly [number, number, number]
}

const ECHO_LAYERS: readonly EchoLayer[] = [
  {
    opacity: 0.72,
    position: [-0.18, 0.08, -0.62],
    rotation: [0.025, -0.18, -0.04],
    scale: 0.97,
  },
  {
    opacity: 0.6,
    position: [-0.48, -0.04, -1.08],
    rotation: [-0.018, 0.24, 0.055],
    scale: 0.9,
  },
]

/** Construit les cinq longues lignes situées derrière la sculpture. */
function createAtmosphericLineGeometry() {
  const geometry = new BufferGeometry()

  geometry.setAttribute(
    'position',
    new Float32BufferAttribute(
      [
        -1.5, 1.64, -0.55,
        1.38, 1.3, -0.55,

        -1.72, 0.92, -0.15,
        1.62, 0.48, -0.15,

        -1.48, 0.08, -0.72,
        1.78, -0.28, -0.72,

        -1.3, -0.76, -0.38,
        1.46, -1.02, -0.38,

        -1.02, -1.52, -0.92,
        1.18, -1.68, -0.92,
      ],
      3,
    ),
  )

  return geometry
}

/**
 * Produit une disposition déterministe des fragments.
 * Aucun Math.random() n’est utilisé : la composition reste identique.
 */
function createFragmentDescriptors(
  count: number,
): FragmentDescriptor[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = index * 2.399963 + 0.42
    const side = index % 2 === 0 ? 1 : -1
    const verticalBand = (index % 9) / 8
    const distance = 0.92 + (index % 4) * 0.11

    const depth =
      Math.sin(angle) * 0.58
      - 0.18
      - (index % 3) * 0.08

    const size =
      0.52
      + (index % 5) * 0.11

    return {
      position: [
        Math.cos(angle) * distance + side * 0.2,
        -1.7
          + verticalBand * 3.4
          + Math.sin(angle * 1.7) * 0.08,
        depth,
      ],

      rotation: [
        angle * 0.37,
        angle * 0.63,
        angle * 0.21,
      ],

      scale: [
        size * 0.82,
        size * (0.72 + (index % 3) * 0.2),
        size * 0.56,
      ],
    }
  })
}

/**
 * Assemble et anime la sculpture Ghost Signal.
 */
export function GhostSignalScene({
  compact,
  onSignalChange,
  pointer,
  profile,
  scroll,
}: GhostSignalSceneProps) {
  /** Groupe principal déplacé et tourné à chaque frame. */
  const sculpture = useRef<Group>(null)

  /** Références vers les échos secondaires. */
  const echoGroups = useRef<Array<Group | null>>([])

  /** Mesh contenant tous les fragments. */
  const fragments = useRef<InstancedMesh>(null)

  /** Groupe permettant de déplacer tous les fragments ensemble. */
  const fragmentRig = useRef<Group>(null)

  /** Intensité rouge transmise aux shaders des membranes. */
  const redSignal = useRef(0)

  /** État logique utilisé pour synchroniser le repère rouge du DOM. */
  const signalActive = useRef(false)

  /** Version la plus récente du callback React. */
  const signalChangeRef = useRef(onSignalChange)

  /**
   * Cylindre déformé par le vertex shader.
   */
  const geometry = useMemo(
    () =>
      new CylinderGeometry(
        0.76,
        0.58,
        4.25,
        profile.segments[0],
        profile.segments[1],
        false,
      ),
    [profile],
  )

  /** Géométrie très simple partagée par tous les fragments. */
  const fragmentGeometry = useMemo(
    () => new TetrahedronGeometry(0.13, 0),
    [],
  )

  /**
   * Matériau fantomatique des fragments.
   *
   * AdditiveBlending mélange leur couleur avec l'arrière-plan sombre :
   * ils ressemblent ainsi davantage à des éclats lumineux transparents.
   */
  const fragmentMaterial = useMemo(
    () =>
      new MeshBasicMaterial({
        color: '#5264c9',
        blending: AdditiveBlending,
        depthTest: true,
        depthWrite: false,
        opacity: 0.24,
        transparent: true,
        toneMapped: false,
      }),
    [],
  )

  /** Couleur normale des fragments. */
  const fragmentBaseColor = useMemo(
    () => new Color('#4f5fc4'),
    [],
  )

  /** Couleur des fragments pendant l’anomalie rouge. */
  const fragmentSignalColor = useMemo(
    () => new Color('#ff170d'),
    [],
  )

  /**
   * Position et transformation de chaque fragment.
   */
  const fragmentDescriptors = useMemo(
    () => createFragmentDescriptors(profile.fragments),
    [profile.fragments],
  )

  const lineGeometry = useMemo(
    createAtmosphericLineGeometry,
    [],
  )

  const lineMaterial = useMemo(
    () =>
      new LineBasicMaterial({
        color: '#8f98de',
        transparent: true,
        opacity: 0.2,
      }),
    [],
  )

  /** Le profil de qualité choisit combien d’échos afficher. */
  const echoLayers =
    ECHO_LAYERS.slice(0, profile.echoes)

  /** Position adaptée à la taille de l’écran. */
  const baseX = compact ? 0.28 : 1.08
  const baseY = compact ? 0.28 : -0.02

  /** Échelle adaptée à la taille de l’écran. */
  const sculptureScale = compact
    ? ([0.72, 0.76, 0.72] as const)
    : ([1.28, 0.84, 1.18] as const)

  signalChangeRef.current = onSignalChange

  /**
   * Enregistre la transformation de chaque fragment dans l’InstancedMesh.
   */
  useEffect(() => {
    const mesh = fragments.current

    if (!mesh) return

    const transform = new Object3D()

    fragmentDescriptors.forEach((fragment, index) => {
      transform.position.set(...fragment.position)
      transform.rotation.set(...fragment.rotation)
      transform.scale.set(...fragment.scale)
      transform.updateMatrix()

      mesh.setMatrixAt(
        index,
        transform.matrix,
      )
    })

    mesh.instanceMatrix.needsUpdate = true
  }, [fragmentDescriptors])

  /** Libère le cylindre lorsqu’il est remplacé ou démonté. */
  useEffect(
    () => () => geometry.dispose(),
    [geometry],
  )

  /** Libère les autres ressources Three.js au démontage. */
  useEffect(
    () => () => {
      fragmentGeometry.dispose()
      fragmentMaterial.dispose()
      lineGeometry.dispose()
      lineMaterial.dispose()
    },
    [
      fragmentGeometry,
      fragmentMaterial,
      lineGeometry,
      lineMaterial,
    ],
  )

  /** Désactive le signal DOM lorsque la scène disparaît. */
  useEffect(
    () => () => signalChangeRef.current(false),
    [],
  )

  /**
   * Anime la scène avant chaque frame.
   */
  useFrame(({ clock }, delta) => {
    const currentSculpture = sculpture.current

    if (!currentSculpture) return

    const elapsed = clock.elapsedTime

    /**
     * Intensité commune à la fissure et aux fragments.
     */
    const intensity =
      getGhostSignalIntensity(elapsed)

    redSignal.current = intensity

    /**
     * L’intensité est multipliée pour rendre le changement de couleur
     * des petits fragments nettement visible.
     */
    const fragmentSignalStrength =
      MathUtils.clamp(
        intensity * 6,
        0,
        1,
      )

    /**
     * Ajoute un léger scintillement pendant l’impulsion.
     */
    const fragmentPulse =
      0.78
      + Math.sin(elapsed * 7.5) * 0.22

    const fragmentRedAmount =
      fragmentSignalStrength * fragmentPulse

    /**
     * MeshBasicMaterial ne dépend pas des lumières.
     * Sa couleur passe donc directement du bleu au rouge.
     */
    fragmentMaterial.color
      .copy(fragmentBaseColor)
      .lerp(
        fragmentSignalColor,
        fragmentRedAmount,
      )

      /**
     * Les fragments respirent légèrement même lorsque le signal rouge
     * est inactif. Pendant l'impulsion, ils deviennent plus visibles.
     */
    const ghostBreathing =
      0.5
      + 0.5 * Math.sin(elapsed * 0.85)

    fragmentMaterial.opacity =
      0.2
      + ghostBreathing * 0.08
      + fragmentSignalStrength * 0.42

    /**
     * Informe le DOM uniquement lorsque l’état actif change.
     */
    const nextSignalActive =
      intensity > 0.12

    if (
      nextSignalActive
      !== signalActive.current
    ) {
      signalActive.current =
        nextSignalActive

      signalChangeRef.current(
        nextSignalActive,
      )
    }

    /**
     * Cibles de rotation et de déplacement de la sculpture principale.
     */
    const targetRotationX =
      pointer.current.y * -0.12
      + scroll.current * 0.07

    const targetRotationY =
      pointer.current.x * 0.22
      + scroll.current * 0.13

    const targetRotationZ =
      pointer.current.x * -0.025
      + Math.sin(elapsed * 0.18) * 0.018

    const targetPositionX =
      baseX
      + pointer.current.x * 0.38
      - scroll.current * 0.2

    const targetPositionY =
      baseY
      + pointer.current.y * 0.16
      + scroll.current * 0.08

    /**
     * MathUtils.damp crée des déplacements progressifs et amortis.
     */
    currentSculpture.rotation.x =
      MathUtils.damp(
        currentSculpture.rotation.x,
        targetRotationX,
        1.9,
        delta,
      )

    currentSculpture.rotation.y =
      MathUtils.damp(
        currentSculpture.rotation.y,
        targetRotationY,
        1.7,
        delta,
      )

    currentSculpture.rotation.z =
      MathUtils.damp(
        currentSculpture.rotation.z,
        targetRotationZ,
        1.35,
        delta,
      )

    currentSculpture.position.x =
      MathUtils.damp(
        currentSculpture.position.x,
        targetPositionX,
        1.55,
        delta,
      )

    currentSculpture.position.y =
      MathUtils.damp(
        currentSculpture.position.y,
        targetPositionY,
        1.55,
        delta,
      )

    /**
     * Anime les échos avec un retard différent.
     */
    echoGroups.current.forEach(
      (echo, index) => {
        if (!echo) return

        const layer = echoLayers[index]

        if (!layer) return

        const lag =
          0.9 + index * 0.28

        const direction =
          index % 2 === 0 ? -1 : 1

        echo.rotation.x =
          MathUtils.damp(
            echo.rotation.x,
            layer.rotation[0]
              + targetRotationX
                * (0.72 - index * 0.08),
            lag,
            delta,
          )

        echo.rotation.y =
          MathUtils.damp(
            echo.rotation.y,
            layer.rotation[1]
              + targetRotationY
                * (1.18 + index * 0.2),
            lag,
            delta,
          )

        echo.position.x =
          MathUtils.damp(
            echo.position.x,
            baseX
              + layer.position[0]
              + pointer.current.x
                * (0.2 + index * 0.05)
              + direction
                * scroll.current
                * (0.16 + index * 0.08),
            lag,
            delta,
          )

        echo.position.y =
          MathUtils.damp(
            echo.position.y,
            baseY
              + layer.position[1]
              + pointer.current.y
                * (0.08 + index * 0.03),
            lag,
            delta,
          )
      },
    )

 if (fragmentRig.current) {
  /**
   * Rotation orbitale clairement visible autour de la sculpture.
   */
  fragmentRig.current.rotation.y =
    MathUtils.damp(
      fragmentRig.current.rotation.y,
      targetRotationY * 0.48
        + elapsed * 0.065,
      1.15,
      delta,
    )

  /**
   * Les deux autres axes empêchent les fragments de tourner
   * comme un simple disque parfaitement horizontal.
   */
  fragmentRig.current.rotation.x =
    MathUtils.damp(
      fragmentRig.current.rotation.x,
      pointer.current.y * 0.1
        + Math.sin(elapsed * 0.28) * 0.08,
      1.05,
      delta,
    )

  fragmentRig.current.rotation.z =
    MathUtils.damp(
      fragmentRig.current.rotation.z,
      pointer.current.x * -0.06
        + Math.sin(elapsed * 0.19) * 0.05,
      1,
      delta,
    )

  /**
   * Le scroll repousse les fragments dans la profondeur.
   */
  fragmentRig.current.position.z =
    MathUtils.damp(
      fragmentRig.current.position.z,
      -0.04
        - scroll.current * 0.22,
      0.9,
      delta,
    )
}

  })

  return (
    <>
      {/* Échos placés derrière la sculpture. */}
      {echoLayers.map((layer, index) => (
        <group
          key={`echo-${index}`}
          position={[
            baseX + layer.position[0],
            baseY + layer.position[1],
            layer.position[2],
          ]}
          ref={(node) => {
            echoGroups.current[index] = node
          }}
          rotation={layer.rotation}
          scale={sculptureScale}
        >
          <GhostMembrane
            geometry={geometry}
            highQuality={profile.id === 'high'}
            layer={index + 1}
            mode="echo"
            opacity={layer.opacity}
            pointer={pointer}
            redSignal={redSignal}
            renderOrder={1 + index}
            scale={layer.scale}
            scroll={scroll}
          />
        </group>
      ))}

      {/* Sculpture principale. */}
      <group
        position={[baseX, baseY, 0]}
        ref={sculpture}
        scale={sculptureScale}
      >
        {/* Cœur sombre et opaque. */}
        <GhostMembrane
          geometry={geometry}
          highQuality={profile.id === 'high'}
          layer={0}
          mode="core"
          opacity={1}
          pointer={pointer}
          redSignal={redSignal}
          renderOrder={5}
          scale={[0.86, 0.965, 0.86]}
          scroll={scroll}
        />

        {/* Enveloppe arrière facultative. */}
        {profile.backShell ? (
          <GhostMembrane
            geometry={geometry}
            highQuality
            layer={0}
            mode="back"
            opacity={0.88}
            pointer={pointer}
            redSignal={redSignal}
            renderOrder={6}
            scale={1.015}
            scroll={scroll}
          />
        ) : null}

        {/* Enveloppe avant visible. */}
        <GhostMembrane
          geometry={geometry}
          highQuality={profile.id === 'high'}
          layer={0}
          mode="front"
          opacity={1}
          pointer={pointer}
          redSignal={redSignal}
          renderOrder={7}
          scale={1.025}
          scroll={scroll}
        />

        {/* Fragments flottants utilisant le matériau bleu/rouge partagé. */}
        <group ref={fragmentRig}>
          <instancedMesh
            args={[
              fragmentGeometry,
              fragmentMaterial,
              fragmentDescriptors.length,
            ]}
            frustumCulled={false}
            ref={fragments}
            renderOrder={8}
          />
        </group>

        {/* Lignes atmosphériques réservées au profil approprié. */}
        {profile.atmosphericLines ? (
          <lineSegments
            geometry={lineGeometry}
            material={lineMaterial}
            position={[0.02, 0, -0.34]}
            renderOrder={3}
          />
        ) : null}
      </group>
    </>
  )
}
