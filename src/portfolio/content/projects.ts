import signalHorizon from '../../assets/portfolio/signal-horizon.webp'

import type { ProjectEntry } from './types'

/**
 * Copy this unpublished template when a documented project is ready.
 * It is intentionally descriptive rather than a fictional public project.
 */
export const projects = [
  {
    slug: 'project-template',
    title: 'PROJET À DOCUMENTER — BROUILLON NON PUBLIÉ',
    year: 2026,
    status: 'Brouillon',
    summary: 'Exemple de structure à remplacer par un projet réel documenté.',
    introduction:
      'Ce contenu sert uniquement de modèle éditorial et reste absent du portfolio public.',
    cover: {
      src: signalHorizon,
      alt: 'Image provisoire du modèle de projet non publié.',
      width: 1600,
      height: 900,
      position: 'center',
    },
    tags: ['À renseigner'],
    role: ['À renseigner'],
    stack: ['À renseigner'],
    links: [],
    sections: [
      {
        id: 'intentions',
        type: 'text',
        title: 'Intentions',
        paragraphs: ['Remplacer ce paragraphe par le contexte et les intentions du projet.'],
      },
      {
        id: 'informations',
        type: 'metadata',
        title: 'Informations',
        items: [
          { label: 'Rôle', value: 'À renseigner' },
          { label: 'Technologies', value: 'À renseigner' },
        ],
      },
    ],
    published: false,
  },
] satisfies readonly ProjectEntry[]
