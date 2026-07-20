import fogReflections from '@/portfolio/assets/fog-reflections.webp'
import nemylAudio from '@/portfolio/assets/Project_WE310.wav'

import type { MusicEntry } from './types'

/**
 * Modèle éditorial sans titre, visuel ni audio fictifs. `published: false`
 * l'écarte de toutes les sélections publiques.
 */
export const music = [
  {
    slug: 'ep-1',
    title: 'Nemyl',
    year: 2026,
    status: 'En développement',
    summary: 'Exemple de scène sonore à compléter avec un morceau réel.',
    artwork: {
      src: fogReflections,
      alt: 'Image provisoire du modèle de scène sonore montrant des reflets dans la brume.',
      width: 720,
      height: 1440,
      position: 'right',
    },
    audioSrc: nemylAudio,
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
    published: true,
  },
  {
    slug: 'music-template-2',
    title: 'À TITRER — BROUILLON NON PUBLIÉ',
    year: 2026,
    status: 'Brouillon',
    summary: 'Exemple de seconde scène sonore à compléter avec un morceau réel.',
    artwork: null,
    credits: [],
    links: [],
    sections: [
      {
        id: 'description',
        type: 'text',
        title: 'Description',
        paragraphs: ['Remplacer ce paragraphe par la description du morceau.'],
      },
    ],
    published: false,
  },
] satisfies readonly MusicEntry[]
