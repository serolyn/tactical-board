import { describe, expect, it } from 'vitest'

import {
  getPublishedLabBySlug,
  getPublishedMusicBySlug,
  getPublishedProjectBySlug,
  lab,
  music,
  projects,
  publishedLab,
  publishedMusic,
  publishedProjects,
} from '@/portfolio/content/portfolioContent'

describe('contenus publiés du portfolio', () => {
  it('expose exactement les entrées marquées comme publiées', () => {
    expect(publishedProjects.map((entry) => entry.slug)).toEqual(
      projects.filter((entry) => entry.published).map((entry) => entry.slug),
    )
    expect(publishedMusic.map((entry) => entry.slug)).toEqual(
      music.filter((entry) => entry.published).map((entry) => entry.slug),
    )
    expect(publishedLab.map((entry) => entry.slug)).toEqual(
      lab.filter((entry) => entry.published).map((entry) => entry.slug),
    )

    expect(getPublishedProjectBySlug('project-template')).toMatchObject({
      title: 'Nemyl, la ville des reflets',
      published: true,
    })
    expect(
      getPublishedProjectBySlug('project-template')?.sections.some(
        (section) => section.type === 'component',
      ),
    ).toBe(true)

    expect(getPublishedMusicBySlug('ep-1')).toMatchObject({
      title: 'Nemyl',
      published: true,
    })
    expect(getPublishedMusicBySlug('music-template-2')).toMatchObject({
      title: 'SRO',
      published: true,
    })
  })

  it('conserve les contrats essentiels des deux entrées Lab publiées', () => {
    expect(publishedLab.map((entry) => entry.slug)).toEqual([
      'tactical-board',
      'signal-fantome',
    ])

    const tacticalBoard = getPublishedLabBySlug('tactical-board')
    expect(tacticalBoard).toMatchObject({
      title: 'TACTICAL BOARD',
      statement: 'Cartographier une guerre.',
    })
    expect(tacticalBoard?.links).toContainEqual({
      label: 'Ouvrir le tableau',
      href: '/board',
      kind: 'internal',
    })
    expect(
      tacticalBoard?.sections.some(
        (section) =>
          section.type === 'metadata'
          && section.items.some(
            (item) => item.value === 'Les données restent locales au navigateur.',
          ),
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
})
