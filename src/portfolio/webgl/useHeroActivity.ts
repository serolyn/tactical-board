/**
 * @packageDocumentation
 * Effets WebGL du portfolio.
 *
 * Ce dossier contient la partie visuelle avancée du hero: shaders, scènes et
 * fallback. Si WebGL n'est pas disponible, ces fichiers expliquent aussi quoi
 * faire à la place.
 */

import { useEffect, useState, type RefObject } from 'react'

/** Maintient la boucle de rendu seulement lorsque le hero et l'onglet sont visibles. */
export function useHeroActivity(
  heroRef: RefObject<HTMLElement | null>,
  enabled: boolean,
): boolean {
  const [heroVisible, setHeroVisible] = useState(true)
  const [tabVisible, setTabVisible] = useState(
    () => typeof document === 'undefined' || document.visibilityState !== 'hidden',
  )

  useEffect(() => {
    if (!enabled) {
      setHeroVisible(false)
      return undefined
    }

    const hero = heroRef.current
    if (!hero || typeof IntersectionObserver === 'undefined') {
      setHeroVisible(true)
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => setHeroVisible(Boolean(entry?.isIntersecting && entry.intersectionRatio > 0)),
      { threshold: [0, 0.02] },
    )
    // Le hero apparaît d'abord à l'écran : on démarre sans attendre, puis
    // l'observateur suspend les images si le défilement le masque.
    setHeroVisible(true)
    observer.observe(hero)

    return () => observer.disconnect()
  }, [enabled, heroRef])

  useEffect(() => {
    if (!enabled || typeof document === 'undefined') return undefined

    const updateVisibility = () => setTabVisible(document.visibilityState !== 'hidden')
    updateVisibility()
    document.addEventListener('visibilitychange', updateVisibility)

    return () => document.removeEventListener('visibilitychange', updateVisibility)
  }, [enabled])

  return enabled && heroVisible && tabVisible
}
