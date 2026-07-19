import { describe, expect, it } from 'vitest'

import { getRouteMetadata, routeMetadata } from './routeMetadata'

describe('routeMetadata', () => {
  it.each([
    ['/', 'SEROLYN — Entre plusieurs vies'],
    ['/projects', 'Projets — SEROLYN'],
    ['/projects/tactical-board', 'Tactical Board — Lab SEROLYN'],
    ['/board', 'Tactical Board — Éditeur tactique'],
    ['/music', 'Scènes sonores — SEROLYN'],
    ['/lab', 'Lab — SEROLYN'],
    ['/lab/tactical-board', 'Tactical Board — Lab SEROLYN'],
    ['/lab/signal-fantome', 'Signal fantôme — Lab SEROLYN'],
    ['/about', 'À propos — SEROLYN'],
  ])('associe %s à son titre et à une description', (pathname, title) => {
    expect(getRouteMetadata(pathname)).toEqual({
      title,
      description: routeMetadata[pathname]?.description,
    })
    expect(getRouteMetadata(pathname).description).not.toBe('')
  })

  it('normalise les barres obliques finales', () => {
    expect(getRouteMetadata('/board///')).toEqual(routeMetadata['/board'])
    expect(getRouteMetadata('/lab/signal-fantome/')).toEqual(
      routeMetadata['/lab/signal-fantome'],
    )
  })

  it('retourne les métadonnées 404 pour une route inconnue', () => {
    expect(getRouteMetadata('/projects/project-template')).toEqual({
      title: 'Page introuvable — SEROLYN',
      description: 'Cette entrée est introuvable, non publiée ou encore en cours de documentation.',
    })
  })
})
