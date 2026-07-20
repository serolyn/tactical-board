/**
 * @packageDocumentation
 * Données éditoriales du portfolio.
 *
 * Ce fichier contient le texte publié, pas la mise en page. C'est ici que tu
 * modifies les titres, résumés, listes et règles de validation du contenu.
 */

import signalHorizon from '@/portfolio/assets/signal-horizon.webp'

import type { ProjectEntry } from './portfolioContentTypes'

/**
 * Modèle non publié à copier lorsqu'un projet documenté est prêt. Son contenu
 * reste descriptif afin de ne pas inventer un projet public.
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
