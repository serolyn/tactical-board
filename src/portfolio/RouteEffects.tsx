import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router'
import { getRouteMetadata } from './routeMetadata'

const DESCRIPTION_SELECTOR = 'meta[name="description"]'

/** Applies route metadata everywhere, and portfolio-only scroll/focus effects. */
export function RouteEffects() {
  const { pathname } = useLocation()
  const initialMetadata = useRef<{ title: string; description?: string } | null>(null)

  useEffect(() => {
    const description = document.head.querySelector<HTMLMetaElement>(DESCRIPTION_SELECTOR)
    initialMetadata.current = { title: document.title, description: description?.content }

    return () => {
      const initial = initialMetadata.current
      if (!initial) return
      document.title = initial.title
      const currentDescription = document.head.querySelector<HTMLMetaElement>(DESCRIPTION_SELECTOR)
      if (initial.description === undefined) currentDescription?.remove()
      else if (currentDescription) currentDescription.content = initial.description
    }
  }, [])

  useEffect(() => {
    const metadata = getRouteMetadata(pathname)
    const existingDescription = document.head.querySelector<HTMLMetaElement>(DESCRIPTION_SELECTOR)
    const description = existingDescription ?? document.createElement('meta')

    if (!existingDescription) {
      description.name = 'description'
      document.head.append(description)
    }

    document.title = metadata.title
    description.content = metadata.description

    if (pathname === '/board') return

    const scrollContainer = document.querySelector<HTMLElement>('[data-portfolio-scroll]')
    if (scrollContainer) scrollContainer.scrollTop = 0
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0

    const main = document.querySelector<HTMLElement>('#portfolio-main')
    let focusFrame = 0
    let observer: MutationObserver | null = null

    const focusHeading = () => {
      const heading = main?.querySelector<HTMLElement>('h1')
      if (!heading) return
      heading.focus({ preventScroll: true })
      observer?.disconnect()
    }

    focusFrame = window.requestAnimationFrame(focusHeading)
    if (main && !main.querySelector('h1')) {
      observer = new MutationObserver(() => {
        window.cancelAnimationFrame(focusFrame)
        focusFrame = window.requestAnimationFrame(focusHeading)
      })
      observer.observe(main, { childList: true, subtree: true })
    }

    return () => {
      window.cancelAnimationFrame(focusFrame)
      observer?.disconnect()
    }
  }, [pathname])

  return null
}
