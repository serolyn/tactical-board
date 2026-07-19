import type { MusicEntry } from './types'

/**
 * Editorial template only. It has no fictional song title, artwork or audio,
 * and `published: false` keeps it out of every public selector.
 */
export const music = [
  {
    slug: 'music-template',
    title: 'À TITRER — BROUILLON NON PUBLIÉ',
    year: 2026,
    status: 'Brouillon',
    summary: 'Exemple de scène sonore à compléter avec un morceau réel.',
    artwork: null,
    credits: [],
    links: [],
    sections: [
      {
        id: 'description',
        type: 'text',
        title: 'Description',
        paragraphs: ['Remplacer ce paragraphe par la description de la scène sonore.'],
      },
      {
        id: 'notes',
        type: 'quote',
        quote: 'Ajouter ici un fragment ou une note seulement lorsqu’un morceau existe.',
      },
    ],
    published: false,
  },
] satisfies readonly MusicEntry[]
