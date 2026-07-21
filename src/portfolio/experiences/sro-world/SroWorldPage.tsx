import {
  lazy,
  Suspense,
} from 'react'

import {
  Link,
} from 'react-router'

import './sro-world.css'

/*
 * Le Canvas est chargé uniquement lorsque l'utilisateur ouvre le monde SRO.
 * Three.js ne gonfle donc pas les pages ordinaires du portfolio.
 */
const SroWorldCanvas = lazy(() => import('./SroWorldCanvas'))

/*
 * Page immersive indépendante du PortfolioShell.
 *
 * Elle occupe tout l'écran et sert de conteneur au monde 3D. Les éléments HTML
 * restent limités aux informations essentielles et au bouton de sortie.
 */
export function SroWorldPage() {
  return (
    <main
      className="sro-world-page"
      aria-label="Monde tridimensionnel interactif de SRO"
    >
      <div
        className="sro-world-page__canvas"
        aria-label="Scène 3D interactive contenant une télévision"
      >
        <Suspense
          fallback={
            <div
              className="sro-world-page__loading"
              role="status"
            >
              <span aria-hidden="true" />
              Initialisation du monde SRO…
            </div>
          }
        >
          <SroWorldCanvas />
        </Suspense>
      </div>

      <header className="sro-world-page__header">
        <div>
          <p>SEROLYN / SRO WORLD</p>
        </div>

        <Link
          className="sro-world-page__exit"
          to="/music/music-template-2"
        >
          Quitter le monde
        </Link>
      </header>

      <div className="sro-world-page__instructions">
        <p>
          Déplacez doucement la souris pour observer l'espace.
        </p>
        <span>
          Cliquez sur la télévision pour vous approcher, puis changer d'écran.
        </span>
      </div>

      <div
        className="sro-world-page__vignette"
        aria-hidden="true"
      />

      <div
        className="sro-world-page__grain"
        aria-hidden="true"
      />
    </main>
  )
}

export default SroWorldPage
