/**
 * @packageDocumentation
 * Tests automatiques du projet.
 *
 * Ce fichier vérifie un comportement précis pour éviter les régressions.
 * Quand tu modifies le code associé, lis ce test pour comprendre ce qui doit
 * rester vrai.
 */

import { describe, expect, it } from 'vitest'

import {
  getPublishedLabBySlug,
  getPublishedMusicBySlug,
  getPublishedProjectBySlug,
  lab,
  music,
  portfolioContent,
  projects,
  publishedLab,
  publishedMusic,
  publishedProjects,
  validatePortfolioContent,
} from '@/portfolio/content/portfolioContent'
import type { PortfolioContent } from '@/portfolio/content/portfolioContentTypes'

describe('contenus publiés du portfolio', () => {
  it('valide le catalogue livré et exclut les brouillons des sélecteurs publics', () => {
    expect(validatePortfolioContent(portfolioContent)).toEqual([])
    expect(projects[0]?.published).toBe(false)
    expect(music[0]?.published).toBe(true)
    expect(music[1]?.published).toBe(false)
    expect(publishedProjects).toEqual([])
    expect(publishedMusic.map((entry) => entry.slug)).toEqual(['music-template'])
    expect(getPublishedProjectBySlug('project-template')).toBeUndefined()
    expect(getPublishedMusicBySlug('music-template')).toMatchObject({
      title: 'À TITRER — BROUILLON NON PUBLIÉ',
    })
    expect(getPublishedMusicBySlug('music-template-2')).toBeUndefined()
  })

  it('conserve les contrats essentiels des deux entrées Lab publiées', () => {
    expect(publishedLab.map((entry) => entry.slug)).toEqual([
      'tactical-board',
      'signal-fantome',
    ])

    const tacticalBoard = getPublishedLabBySlug('tactical-board')
    expect(tacticalBoard).toMatchObject({
      title: 'TACTICAL BOARD',
      statement: 'Cartographier une guerre intérieure.',
    })
    expect(tacticalBoard?.links).toContainEqual({
      label: 'Ouvrir le tableau',
      href: '/board',
      kind: 'internal',
    })
    expect(
      tacticalBoard?.sections.some(
        (section) =>
          section.type === 'metadata' &&
          section.items.some((item) => item.value === 'Les données restent locales au navigateur.'),
      ),
    ).toBe(true)

    const signal = getPublishedLabBySlug('signal-fantome')
    expect(signal?.links).toContainEqual({
      label: 'Ouvrir la planche autonome',
      href: 'art-direction/',
      kind: 'static',
    })
    expect(signal?.sections.filter((section) => section.type === 'image')).toHaveLength(5)
  })

  it('refuse doublons, slugs réservés ou non canoniques et média publié absent', () => {
    const duplicate = {
      ...portfolioContent,
      music: [{ ...music[0], slug: projects[0]!.slug }],
    } satisfies PortfolioContent
    expect(validatePortfolioContent(duplicate)).toContainEqual(
      expect.objectContaining({ code: 'duplicate-slug', collection: 'music' }),
    )

    for (const slug of ['board', 'projects', 'art-direction']) {
      const reserved = {
        ...portfolioContent,
        lab: [{ ...lab[0]!, slug }],
      } satisfies PortfolioContent
      expect(validatePortfolioContent(reserved)).toContainEqual(
        expect.objectContaining({ code: 'reserved-slug', slug }),
      )
    }

    const malformed = {
      ...portfolioContent,
      music: [
        {
          ...music[0]!,
          slug: 'Scène Invalide',
          title: '   ',
          artwork: null,
          published: true,
        },
      ],
    } satisfies PortfolioContent
    expect(validatePortfolioContent(malformed)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'invalid-slug', field: 'slug' }),
        expect.objectContaining({ code: 'missing-field', field: 'title' }),
        expect.objectContaining({ code: 'missing-field', field: 'artwork' }),
      ]),
    )
  })
})
