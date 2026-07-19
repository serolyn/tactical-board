import { describe, expect, it } from 'vitest'

import { getRouteMetadata, routeMetadata } from './routeMetadata'

describe('routeMetadata', () => {
  it.each([
    ['/', 'SEROLYN — Code, image et musique'],
    ['/projects', 'Projets — SEROLYN'],
    ['/projects/tactical-board', 'Tactical Board — SEROLYN'],
    ['/board', 'Tactical Board — Éditeur tactique'],
    ['/music', 'Musique — SEROLYN'],
    ['/lab', 'Laboratoire — SEROLYN'],
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
    expect(getRouteMetadata('/projects/tactical-board/')).toEqual(
      routeMetadata['/projects/tactical-board'],
    )
  })

  it('retourne les métadonnées 404 pour une route inconnue', () => {
    expect(getRouteMetadata('/route-inconnue')).toEqual({
      title: 'Page introuvable — SEROLYN',
      description: "Cette trajectoire n'existe pas encore dans la cartographie de SEROLYN.",
    })
  })
})
