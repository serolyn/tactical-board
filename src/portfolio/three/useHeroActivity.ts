import { useEffect, useState, type RefObject } from 'react'

/** Keeps the render loop alive only while the hero and browser tab are visible. */
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
    // The home hero mounts in view. Start immediately, then let the observer
    // suspend subsequent frames if layout or scrolling proves otherwise.
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
