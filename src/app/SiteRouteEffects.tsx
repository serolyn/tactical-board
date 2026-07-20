/**
 * @packageDocumentation
 * Synchronise les métadonnées HTML avec la route active.
 *
 * Ce module met à jour le `<title>` et la meta description à chaque navigation,
 * puis restaure l'état initial lors du démontage du routeur.
 */
import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router'
import { getSiteRouteMetadata } from './siteRouteMetadata'

const DESCRIPTION_META_SELECTOR = 'meta[name="description"]'

/** Met à jour les métadonnées communes sans coupler le routeur aux animations du portfolio. */
export function SiteRouteEffects() {
  const { pathname } = useLocation()
  const initialMetadata = useRef<{ title: string; description?: string } | null>(null)

  useEffect(() => {
    const description = document.head.querySelector<HTMLMetaElement>(DESCRIPTION_META_SELECTOR)
    initialMetadata.current = { title: document.title, description: description?.content }

    return () => {
      const initial = initialMetadata.current
      if (!initial) return
      document.title = initial.title
      const currentDescription = document.head.querySelector<HTMLMetaElement>(
        DESCRIPTION_META_SELECTOR,
      )
      if (initial.description === undefined) currentDescription?.remove()
      else if (currentDescription) currentDescription.content = initial.description
    }
  }, [])

  useEffect(() => {
    const metadata = getSiteRouteMetadata(pathname)
    const existingDescription = document.head.querySelector<HTMLMetaElement>(
      DESCRIPTION_META_SELECTOR,
    )
    const description = existingDescription ?? document.createElement('meta')

    if (!existingDescription) {
      description.name = 'description'
      document.head.append(description)
    }

    document.title = metadata.title
    description.content = metadata.description
  }, [pathname])

  return null
}
