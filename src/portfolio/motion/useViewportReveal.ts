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

export function supportsViewportObservation() {
  return (
    typeof window !== 'undefined' &&
    typeof window.IntersectionObserver === 'function'
  )
}

/**
 * Small observer primitive shared by Reveal and StaggerGroup. Its safe state is
 * visible: unsupported APIs, construction failures and missing targets never
 * strand editorial content at opacity zero.
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
