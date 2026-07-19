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
  selectPublishedEntries,
  siteContent,
  validatePortfolioContent,
} from './index'
import type { PortfolioContent } from './types'

describe('contenu du portfolio', () => {
  it('valide le catalogue livré sans erreur', () => {
    expect(validatePortfolioContent(portfolioContent)).toEqual([])
  })

  it('publie les deux expériences réelles du Lab', () => {
    expect(publishedLab.map((entry) => entry.slug)).toEqual([
      'tactical-board',
      'signal-fantome',
    ])
    expect(getPublishedLabBySlug('tactical-board')?.statement).toBe(
      'Cartographier une guerre intérieure.',
    )
    expect(getPublishedLabBySlug('signal-fantome')?.overline).toBe(
      'LAB / SYSTÈME VISUEL / 2026',
    )
  })

  it('conserve les textes éditoriaux fournis pour l’accueil et les états vides', () => {
    expect(siteContent.home).toMatchObject({
      overline: 'SEROLYN / PARIS / 2026',
      title: 'ENTRE PLUSIEURS VIES',
      introduction: 'Code, sons et systèmes pour donner une forme à ce qui flotte.',
    })
    expect(siteContent.projects.emptyState).toBe(
      'Les premiers systèmes sont encore en cours de documentation.',
    )
    expect(siteContent.music).toMatchObject({
      title: 'SCÈNES SONORES',
      introduction: 'Chaque morceau est un lieu émotionnel à habiter.',
      emptyState: 'Les premières scènes seront ajoutées ici.',
    })
  })

  it('décrit Tactical Board sans promesse chiffrée et avec son avertissement local', () => {
    const tacticalBoard = getPublishedLabBySlug('tactical-board')

    expect(tacticalBoard).toMatchObject({
      overline: 'LAB / SYSTÈME INTERACTIF / 2026',
      statement: 'Cartographier une guerre intérieure.',
      summary:
        'Un système interactif où projets, obstacles, ressources et objectifs deviennent forces, fronts et trajectoires.',
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
  })

  it('écarte les brouillons de tous les sélecteurs publics', () => {
    expect(projects).toHaveLength(1)
    expect(music).toHaveLength(1)
    expect(projects[0]?.published).toBe(false)
    expect(music[0]?.published).toBe(false)
    expect(publishedProjects).toEqual([])
    expect(publishedMusic).toEqual([])
    expect(getPublishedProjectBySlug('project-template')).toBeUndefined()
    expect(getPublishedMusicBySlug('music-template')).toBeUndefined()
    expect(selectPublishedEntries([...projects, ...lab])).toEqual(lab)
  })

  it('conserve le brouillon musical sans fausse pochette, audio ou titre public', () => {
    expect(music[0]).toMatchObject({
      title: 'À TITRER — BROUILLON NON PUBLIÉ',
      artwork: null,
      published: false,
    })
    expect('audioSrc' in music[0]).toBe(false)
  })
})

describe('validation du contenu', () => {
  it('refuse un slug dupliqué entre deux rubriques', () => {
    const duplicateMusic = {
      ...music[0],
      slug: projects[0].slug,
    }
    const content = {
      ...portfolioContent,
      music: [duplicateMusic],
    } satisfies PortfolioContent

    expect(validatePortfolioContent(content)).toContainEqual(
      expect.objectContaining({
        code: 'duplicate-slug',
        collection: 'music',
        field: 'slug',
      }),
    )
  })

  it.each(['board', 'projects', 'art-direction'])('refuse le slug réservé « %s »', (slug) => {
    const content = {
      ...portfolioContent,
      lab: [{ ...lab[0], slug }],
    } satisfies PortfolioContent

    expect(validatePortfolioContent(content)).toContainEqual(
      expect.objectContaining({ code: 'reserved-slug', collection: 'lab', slug }),
    )
  })

  it('refuse les champs essentiels absents et les slugs non canoniques', () => {
    const content = {
      ...portfolioContent,
      projects: [
        {
          ...projects[0],
          slug: 'Projet Invalide',
          title: '   ',
          summary: '',
        },
      ],
    } satisfies PortfolioContent
    const issues = validatePortfolioContent(content)

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'invalid-slug', field: 'slug' }),
        expect.objectContaining({ code: 'missing-field', field: 'title' }),
        expect.objectContaining({ code: 'missing-field', field: 'summary' }),
      ]),
    )
  })

  it('exige une image pour une scène musicale publiée', () => {
    const publishedWithoutArtwork = {
      ...music[0],
      slug: 'scene-reelle',
      title: 'SCÈNE RÉELLE',
      published: true,
    }
    const content = {
      ...portfolioContent,
      music: [publishedWithoutArtwork],
    } satisfies PortfolioContent

    expect(validatePortfolioContent(content)).toContainEqual(
      expect.objectContaining({
        code: 'missing-field',
        collection: 'music',
        field: 'artwork',
      }),
    )
  })
})
