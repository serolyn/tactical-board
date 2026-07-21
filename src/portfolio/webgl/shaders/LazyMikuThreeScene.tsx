import { lazy } from 'react'
import { useNavigate } from 'react-router'

import './miku-entry-link.css'

/*
 * La scène Three.js n'est téléchargée que lorsque la page SRO la demande.
 * Cela évite de charger Three, React Three Fiber et Drei sur tout le portfolio.
 */
const MikuThreeScene = lazy(() => import('./mikuscene'))

export function LazyMikuThreeScene() {
  const navigate = useNavigate()

  return (
    <div className="miku-entry-link">
      <MikuThreeScene />

      <button
        aria-label="Entrer dans le monde SRO"
        className="miku-entry-link__button"
        onClick={() => navigate('/music/sro-world')}
        title="Entrer dans le monde SRO"
        type="button"
      />
    </div>
  )
}

export default LazyMikuThreeScene
