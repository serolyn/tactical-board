import fogReflections from '@/portfolio/assets/fog-reflections.webp'
import signalHorizon from '@/portfolio/assets/signal-horizon.webp'

import type { SiteContent } from './portfolioContentTypes'

export const siteContent: SiteContent = {
  identity: {
    name: 'SEROLYN',
    location: 'PARIS',
    year: 2026,
  },
  home: {
    overline: 'SEROLYN / PARIS / 2026',
    title: 'ENTRE PLUSIEURS VIES',
    introduction: 'Code, sons et systèmes pour donner une forme à ce qui est invisible.',
    visual: {
      src: signalHorizon,
      alt: 'Ciel nocturne traversé par une lumière diffuse à l’horizon.',
      width: 1600,
      height: 900,
      position: 'center',
    },
    projectLink: {
      label: 'Explorer les projets',
      href: '/projects',
      kind: 'internal',
    },
    musicLink: {
      label: 'Écouter les scènes',
      href: '/music',
      kind: 'internal',
    },
    aboutFragment:
      'Je construis des systèmes, des scènes sonores et des formes visuelles pour donner une structure à ce qui reste difficile à nommer.',
  },
  projects: {
    title: 'PROJETS',
    emptyState: 'Les premiers systèmes sont encore en cours de documentation.',
  },
  music: {
    title: 'SCÈNES SONORES',
    introduction: 'Chaque morceau est un lieu émotionnel à habiter.',
    emptyState: 'Les premières scènes seront ajoutées ici.',
    atmosphere: {
      src: fogReflections,
      alt: 'Reflets portuaires dans le brouillard nocturne.',
      width: 720,
      height: 1440,
      position: 'center',
    },
  },
  lab: {
    title: 'LAB',
  },
  about: {
    title: 'ENTRE CODE, SON ET IMAGE',
    introduction:
      'Je construis des systèmes, des scènes sonores et des formes visuelles pour donner une structure à ce qui reste difficile à nommer. SEROLYN rassemble ces expériences au même endroit.',
    approach:
      'Code, son et image se rencontrent ici dans des systèmes, des scènes et des formes visuelles.',
    current:
      'Tactical Board reste un outil vivant et expérimental. Signal fantôme en définit le langage visuel nocturne.',
    technologies: [
      'React 19',
      'TypeScript 6',
      'Vite 8',
      'React Router',
      'Zustand',
      'Immer',
      'IndexedDB / idb',
      'Zod',
      'DOMPurify',
      'html-to-image',
      'CSS Modules',
      'Vitest',
      'Testing Library',
    ],
  },
  socialLinks: [],
  contactLinks: [],
}
