import { describe, expect, it } from 'vitest'

import {
  getPublishedLabBySlug,
  getPublishedMusicBySlug,
  getPublishedProjectBySlug,
  music,
  projects,
  publishedLab,
  publishedMusic,
  publishedProjects,
  selectPublishedEntries,
} from '@/portfolio/content/portfolioContent'

describe('contenus publiés du portfolio', () => {
  it('expose les entrées actuellement visibles', () => {
    expect(projects[0]?.sections.some((section) => section.type === 'component')).toBe(true)
    expect(publishedProjects.map((entry) => entry.slug)).toEqual(['project-template'])
    expect(getPublishedProjectBySlug('project-template')).toMatchObject({
      title: 'Nemyl, la ville des reflets',
    })

    expect(publishedMusic.map((entry) => entry.slug)).toEqual([
      'ep-1',
      'music-template-2',
    ])
    expect(getPublishedMusicBySlug('ep-1')).toMatchObject({ title: 'Nemyl' })
    expect(getPublishedMusicBySlug('music-template-2')).toMatchObject({ title: 'SRO' })
  })

  it('cache une entrée lorsque published vaut false', () => {
    const hiddenDraft = {
      ...music[0]!,
      slug: 'brouillon-cache',
      published: false,
    }

    expect(selectPublishedEntries([music[0]!, hiddenDraft]).map((entry) => entry.slug))
      .toEqual(['ep-1'])
  })

  it('conserve les destinations essentielles des entrées Lab', () => {
    expect(publishedLab.map((entry) => entry.slug)).toEqual([
      'tactical-board',
      'signal-fantome',
    ])

    const tacticalBoard = getPublishedLabBySlug('tactical-board')
    expect(tacticalBoard?.links).toContainEqual({
      label: 'Ouvrir le tableau',
      href: '/board',
      kind: 'internal',
    })

    const signal = getPublishedLabBySlug('signal-fantome')
    expect(signal?.links).toContainEqual({
      label: 'Ouvrir la planche autonome',
      href: 'art-direction/',
      kind: 'static',
    })
    expect(signal?.sections.filter((section) => section.type === 'image')).toHaveLength(5)
  })
})
