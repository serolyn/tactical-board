import {
  lazy,
  useState,
} from 'react'

import {
  useNavigate,
} from 'react-router'

import './miku-entry-link.css'

/*
 * La scène Three.js n'est téléchargée
 * que lorsque la page SRO la demande.
 */
const MikuThreeScene =
  lazy(() => import('./mikuscene'))

export function LazyMikuThreeScene() {
  const navigate = useNavigate()

  /*
   * false :
   * la page fonctionne normalement.
   *
   * true :
   * la transition vers le monde SRO
   * est en cours.
   */
  const [entering, setEntering] =
    useState(false)

  const handleEnter = () => {
    /*
     * Empêche plusieurs clics successifs
     * de lancer plusieurs navigations.
     */
    if (entering) {
      return
    }

    /*
     * On démarre la transition.
     */
    setEntering(true)

    /*
     * On attend 1,2 seconde avant
     * d'ouvrir le nouveau monde.
     *
     * Plus tard, le zoom se déroulera
     * pendant ce délai.
     */
    window.setTimeout(() => {
      navigate('/music/sro-world')
    }, 1200)
  }

  return (
    <div
      className={
        entering
          ? 'miku-entry-link miku-entry-link--entering'
          : 'miku-entry-link'
      }
    >
      <MikuThreeScene entering = {entering} />

      <button
        aria-label="Entrer dans le monde SRO"
        className="miku-entry-link__button"
        disabled={entering}
        onClick={handleEnter} 
        title="Entrer dans le monde SRO"
        type="button"
      />
    </div>
  )
}

export default LazyMikuThreeScene