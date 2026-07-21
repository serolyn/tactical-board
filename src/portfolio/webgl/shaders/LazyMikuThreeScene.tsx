import { lazy } from 'react'

/*
 * La scène Three.js n'est téléchargée que lorsque la page SRO la demande.
 * Cela évite de charger Three, React Three Fiber et Drei sur tout le portfolio.
 */
const MikuThreeScene = lazy(() => import('./mikuscene'))

export function LazyMikuThreeScene() {
  return <MikuThreeScene />
}

export default LazyMikuThreeScene
