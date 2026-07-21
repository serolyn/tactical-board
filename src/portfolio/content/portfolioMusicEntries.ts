/**
 * @packageDocumentation
 * Données éditoriales du portfolio.
 *
 * Ce fichier contient le texte publié, pas la mise en page. C'est ici que tu
 * modifies les titres, résumés, listes et règles de validation du contenu.
 */

import SROCOVER from '@/assets/effects/music/SRO.webp'
import fogReflections from '@/portfolio/assets/fog-reflections.webp'
import nemylAudio from '@/portfolio/assets/Project_WE310.wav'
import LazyMikuThreeScene from '@/portfolio/webgl/shaders/LazyMikuThreeScene'

import { MusicStoryOverlay } from './MusicStory/MusicStoryOverlay'

import type { MusicEntry } from './portfolioContentTypes'

/**
 * Liste des morceaux et expériences musicales du portfolio.
 */
export const music = [
  {
    slug: 'ep-1',
    title: 'Nemyl',
    year: 2026,
    status: 'En développement',
    summary: 'Introduction',

    artwork: {
      src: fogReflections,
      alt: 'Image provisoire montrant des reflets dans la brume.',
      width: 720,
      height: 1440,
      position: 'right',
    },

    storyOverlay: MusicStoryOverlay,
    audioSrc: nemylAudio,

    credits: [],
    links: [],

    sections: [
      {
        id: 'description',
        type: 'text',
        title: 'Description',
        paragraphs: [
          'Remplacer ce paragraphe par la description de la scène sonore.',
        ],
      },
      {
        id: 'notes',
        type: 'quote',
        quote:
          'Ajouter ici un fragment ou une note seulement lorsqu’un morceau existe.',
      },
    ],

    published: true,
  },

  {
    slug: 'music-template-2',
    title: 'SRO',
    year: 2026,
    status: 'Brouillon',
    summary:
      'Exemple de seconde scène sonore à compléter avec un morceau réel.',

    artwork: {
      src: SROCOVER,
      alt: 'Cover de la musique SRO.',
      width: 720,
      height: 1440,
      position: 'left',
    },

    storyOverlay: LazyMikuThreeScene,

    credits: [],
    links: [],

    sections: [
      {
        id: 'description',
        type: 'text',
        title: 'Description',
        paragraphs: [
          'Remplacer ce paragraphe par la description du morceau.',
        ],
      },
    ],

    published: true,
  },
] satisfies readonly MusicEntry[]
