import { AnimatePresence, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import {
  useLocation,
  useOutlet,
  type Location,
} from 'react-router'

import { motionDurations } from './motionTokens'
import { PageTransition } from './PageTransition'

export interface AnimatedRoutesProps {
  announcementClassName?: string
  focusSelector?: string
  formatAnnouncement?: (location: Location, heading: HTMLElement | null) => string
  pageClassName?: string
  scrollContainerSelector?: string
}

interface AnimatedRouteFrameProps {
  children: React.ReactNode
  focusSelector: string
  location: Location
  onAnnouncement: (message: string) => void
  pageClassName?: string
  scrollContainerSelector: string
  formatAnnouncement?: AnimatedRoutesProps['formatAnnouncement']
}

function resetRouteScroll(scrollContainerSelector: string) {
  const scrollContainer = document.querySelector<HTMLElement>(scrollContainerSelector)
  if (scrollContainer) scrollContainer.scrollTop = 0
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0
}

function defaultAnnouncement(_location: Location, heading: HTMLElement | null) {
  return heading?.getAttribute('aria-label')
    || heading?.textContent?.trim()
    || document.title
}

function AnimatedRouteFrame({
  children,
  focusSelector,
  formatAnnouncement = defaultAnnouncement,
  location,
  onAnnouncement,
  pageClassName,
  scrollContainerSelector,
}: AnimatedRouteFrameProps) {
  const reducedMotion = Boolean(useReducedMotion())
  const frameRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    resetRouteScroll(scrollContainerSelector)

    let arrivalReady = false
    let announced = false
    let focusTimer = 0
    let fallbackPoll = 0
    let observer: MutationObserver | null = null

    const finishArrival = () => {
      if (!arrivalReady) return false

      const heading = frameRef.current?.querySelector<HTMLElement>(focusSelector) ?? null
      if (!heading) return false

      heading.focus({ preventScroll: true })
      if (!announced) {
        announced = true
        onAnnouncement(formatAnnouncement(location, heading))
      }
      observer?.disconnect()
      if (fallbackPoll) window.clearInterval(fallbackPoll)
      return true
    }

    const arrivalDelay = 1_000 * (
      reducedMotion ? motionDurations.reduced : motionDurations.page
    )

    focusTimer = window.setTimeout(() => {
      arrivalReady = true
      if (!finishArrival() && !announced) {
        announced = true
        onAnnouncement(formatAnnouncement(location, null))
      }
    }, arrivalDelay)

    if (typeof MutationObserver === 'function' && frameRef.current) {
      observer = new MutationObserver(finishArrival)
      observer.observe(frameRef.current, { childList: true, subtree: true })
    } else {
      fallbackPoll = window.setInterval(finishArrival, 80)
    }

    return () => {
      window.clearTimeout(focusTimer)
      if (fallbackPoll) window.clearInterval(fallbackPoll)
      observer?.disconnect()
    }
  }, [
    focusSelector,
    formatAnnouncement,
    location,
    onAnnouncement,
    reducedMotion,
    scrollContainerSelector,
  ])

  return (
    <PageTransition
      className={pageClassName}
      ref={frameRef}
      routeKey={location.key}
    >
      {children}
    </PageTransition>
  )
}

/**
 * Conserve brièvement la page sortante pour son animation, puis limite le
 * défilement et le focus à la seule page entrante.
 */
export function AnimatedRoutes({
  announcementClassName = 'visually-hidden',
  focusSelector = 'h1',
  formatAnnouncement,
  pageClassName,
  scrollContainerSelector = '[data-portfolio-scroll]',
}: AnimatedRoutesProps) {
  const location = useLocation()
  const outlet = useOutlet()
  const [announcement, setAnnouncement] = useState('')

  return (
    <>
      <AnimatePresence initial={false} mode="wait">
        <AnimatedRouteFrame
          focusSelector={focusSelector}
          formatAnnouncement={formatAnnouncement}
          key={location.key}
          location={location}
          onAnnouncement={setAnnouncement}
          pageClassName={pageClassName}
          scrollContainerSelector={scrollContainerSelector}
        >
          {outlet}
        </AnimatedRouteFrame>
      </AnimatePresence>

      <p
        aria-atomic="true"
        aria-live="polite"
        className={announcementClassName}
        data-route-announcement=""
        role="status"
      >
        {announcement}
      </p>
    </>
  )
}
