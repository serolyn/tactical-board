/**
 * @packageDocumentation
 * Animation du portfolio.
 *
 * Ce fichier explique comment les éléments apparaissent, se déplacent ou se
 * révèlent à l'écran. Lis-le pour comprendre pourquoi certaines transitions sont
 * visibles et d'autres très discrètes.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

export interface ViewportRevealOptions {
  disabled?: boolean
  once?: boolean
  root?: Element | null
  rootMargin?: string
  threshold?: number | number[]
}

export interface ViewportRevealState {
  isVisible: boolean
  observerAvailable: boolean
  revealNow: () => void
  setTarget: (node: HTMLElement | null) => void
}
/**
 * Cette fonction intervient sur le sujet “supports Viewport Observation” dans portfolio.
 *
 * Fichier: src/portfolio/motion/useViewportReveal.ts
 * Si tu lis ce fichier pour apprendre, regarde d’abord supportsViewportObservation dans useViewportReveal.ts.
 */


export function supportsViewportObservation() {
  return (
    typeof window !== 'undefined' &&
    typeof window.IntersectionObserver === 'function'
  )
}

/**
 * Primitive d'observation partagée par `Reveal` et `StaggerGroup`. Son état de
 * repli reste visible afin de ne jamais masquer le contenu éditorial.
 */
export function useViewportReveal({
  disabled = false,
  once = true,
  root,
  rootMargin = '0px 0px -10% 0px',
  threshold = 0.16,
}: ViewportRevealOptions = {}): ViewportRevealState {
  const targetRef = useRef<HTMLElement | null>(null)
  const revealedRef = useRef(false)
  const observerAvailable = !disabled && supportsViewportObservation()
  const [isVisible, setIsVisible] = useState(() => !observerAvailable)
  const revealNow = useCallback(() => {
    revealedRef.current = true
    setIsVisible(true)
  }, [])

  useEffect(() => {
    const target = targetRef.current

    if (disabled || !supportsViewportObservation() || !target) {
      setIsVisible(true)
      return undefined
    }

    if (once && revealedRef.current) {
      setIsVisible(true)
      return undefined
    }

    let observer: IntersectionObserver | null = null
    let observationWatchdog = 0

    try {
      const observerRoot =
        root === undefined
          ? target.closest<HTMLElement>('[data-portfolio-scroll]')
          : root

      observer = new window.IntersectionObserver(
        (entries) => {
          if (observationWatchdog) {
            window.clearTimeout(observationWatchdog)
            observationWatchdog = 0
          }
          const entry = entries.find((candidate) => candidate.target === target)
          if (!entry) return

          if (entry.isIntersecting) {
            revealedRef.current = true
            setIsVisible(true)
            if (once) observer?.disconnect()
          } else if (!once) {
            setIsVisible(false)
          }
        },
        { root: observerRoot, rootMargin, threshold },
      )
      observer.observe(target)
      observationWatchdog = window.setTimeout(() => {
        observationWatchdog = 0
        setIsVisible(true)
        observer?.disconnect()
      }, 1_200)
    } catch {
      setIsVisible(true)
    }

    return () => {
      if (observationWatchdog) window.clearTimeout(observationWatchdog)
      observer?.disconnect()
    }
  }, [disabled, once, root, rootMargin, threshold])

  return {
    isVisible,
    observerAvailable,
    revealNow,
    setTarget: (node) => {
      targetRef.current = node
    },
  }
}
