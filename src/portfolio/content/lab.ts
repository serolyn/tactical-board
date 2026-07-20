import fogReflections from '@/portfolio/assets/fog-reflections.webp'
import moonlitHarbor from '@/portfolio/assets/moonlit-harbor.webp'
import signalHorizon from '@/portfolio/assets/signal-horizon.webp'
import signalPreviewDesktop from '@/portfolio/assets/signal-preview-desktop.png'
import signalPreviewMobile from '@/portfolio/assets/signal-preview-mobile.png'
import tacticalTerrain from '@/shared/assets/tactical-terrain.webp'

import type { LabEntry } from './types'

export const lab = [
  {
    slug: 'tactical-board',
    title: 'TACTICAL BOARD',
    year: 2026,
    status: 'En développement',
    overline: 'LAB / SYSTÈME INTERACTIF / 2026',
    kind: 'Système interactif',
    statement: 'Cartographier une guerre intérieure.',
    summary:
      'Un système interactif où projets, obstacles, ressources et objectifs deviennent forces, fronts et trajectoires.',
    cover: {
      src: tacticalTerrain,
      alt: 'Texture sombre du terrain utilisée par Tactical Board.',
      width: 1254,
      height: 1254,
      position: 'center',
    },
    tags: ['React', 'TypeScript', 'Zustand', 'Immer', 'IndexedDB', 'SVG', 'CSS Modules'],
    links: [
      {
        label: 'Ouvrir le tableau',
        href: '/board',
        kind: 'internal',
      },
    ],
    sections: [
      {
        id: 'concept',
        type: 'text',
        title: 'Concept',
        paragraphs: [
          'Un système interactif où projets, obstacles, ressources et objectifs deviennent forces, fronts et trajectoires.',
        ],
      },
      {
        id: 'fonctionnement',
        type: 'text',
        title: 'Fonctionnement',
        paragraphs: [
          'La grille accueille des unités, des factions, des objectifs, des obstacles et des trajectoires. Le plateau reste modifiable au clavier, à la souris et au toucher.',
        ],
      },
      {
        id: 'metaphore',
        type: 'text',
        title: 'Dimension personnelle et métaphorique',
        paragraphs: [
          'Le vocabulaire tactique donne une forme visuelle aux tensions, ressources et directions d’une situation intérieure.',
        ],
      },
      {
        id: 'donnees-locales',
        type: 'metadata',
        title: 'Données',
        items: [
          {
            label: 'Confidentialité',
            value: 'Les données restent locales au navigateur.',
          },
        ],
      },
    ],
    published: true,
  },
  {
    slug: 'signal-fantome',
    title: 'SIGNAL FANTÔME',
    year: 2026,
    status: 'Direction validée',
    overline: 'LAB / SYSTÈME VISUEL / 2026',
    kind: 'Système visuel',
    summary:
      'Une direction visuelle nocturne située entre archive personnelle, morceau ambient et système numérique.',
    cover: {
      src: moonlitHarbor,
      alt: 'Détail nocturne de A Moonlit Harbor de Norbert Goeneutte.',
      width: 1200,
      height: 869,
      position: 'center',
    },
    tags: ['Direction artistique', 'Système visuel', 'Typographie', 'Responsive'],
    links: [
      {
        label: 'Ouvrir la planche autonome',
        href: 'art-direction/',
        kind: 'static',
      },
    ],
    sections: [
      {
        id: 'concept',
        type: 'text',
        title: 'Concept',
        paragraphs: [
          'Une direction visuelle nocturne située entre archive personnelle, morceau ambient et système numérique.',
        ],
      },
      {
        id: 'palette',
        type: 'metadata',
        title: 'Palette',
        items: [
          { label: 'Void', value: '#07080D' },
          { label: 'Deep', value: '#11121C' },
          { label: 'Mist', value: '#DDDDE5' },
          { label: 'Ash', value: '#8D8E9C' },
          { label: 'Signal', value: '#6964C7' },
          { label: 'Ember', value: '#CF4B46' },
          { label: 'Residual warmth', value: '#C99B70' },
        ],
      },
      {
        id: 'typographie',
        type: 'metadata',
        title: 'Typographie',
        items: [
          { label: 'Titres', value: 'Manrope Variable' },
          { label: 'Fragments', value: 'Newsreader Italic' },
          { label: 'Métadonnées', value: 'IBM Plex Mono' },
        ],
      },
      {
        id: 'ciel-nocturne',
        type: 'image',
        title: 'Ciel nocturne',
        image: {
          src: signalHorizon,
          alt: 'Ciel nocturne traversé par une lumière diffuse à l’horizon.',
          width: 1600,
          height: 900,
          position: 'center',
        },
      },
      {
        id: 'reflets-portuaires',
        type: 'image',
        title: 'Reflet portuaire',
        image: {
          src: fogReflections,
          alt: 'Reflets portuaires dans le brouillard nocturne.',
          width: 720,
          height: 1440,
          position: 'center',
        },
      },
      {
        id: 'archive-nocturne',
        type: 'image',
        title: 'Archive nocturne',
        image: {
          src: moonlitHarbor,
          alt: 'Détail nocturne de A Moonlit Harbor de Norbert Goeneutte.',
          width: 1200,
          height: 869,
          position: 'center',
        },
      },
      {
        id: 'capture-desktop',
        type: 'image',
        title: 'Capture desktop',
        image: {
          src: signalPreviewDesktop,
          alt: 'Planche Signal fantôme affichée dans une fenêtre desktop.',
          width: 1440,
          height: 900,
          position: 'top center',
        },
      },
      {
        id: 'capture-mobile',
        type: 'image',
        title: 'Capture mobile',
        image: {
          src: signalPreviewMobile,
          alt: 'Planche Signal fantôme affichée dans une fenêtre mobile.',
          width: 390,
          height: 844,
          position: 'top center',
        },
      },
      {
        id: 'source-canonique',
        type: 'text',
        title: 'Planche autonome',
        paragraphs: [
          'La planche 3A reste la source canonique de cette direction visuelle.',
        ],
      },
    ],
    published: true,
  },
] satisfies readonly LabEntry[]
