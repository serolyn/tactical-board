import { useGLTF } from '@react-three/drei'

import type { ThreeElements } from '@react-three/fiber'

import modelUrl from './low_poly_miku_hatsune.glb?url'

/*
 * Le composant fournit lui-même la prop "object" à <primitive>.
 *
 * On la retire donc du type des props publiques, sinon TypeScript exige
 * absurdement que <MikuModel /> reçoive un objet qu'il charge déjà lui-même.
 */
export type MikuModelProps = Omit<
  ThreeElements['primitive'],
  'object'
>

/*
 * Charge et affiche toute la scène contenue dans le fichier GLB.
 */
export function MikuModel(props: MikuModelProps) {
  const gltf = useGLTF(modelUrl)

  return (
    <primitive
      {...props}
      object={gltf.scene}
    />
  )
}

/*
 * Commence à charger le modèle dès l'importation du module.
 */
useGLTF.preload(modelUrl)

export default MikuModel