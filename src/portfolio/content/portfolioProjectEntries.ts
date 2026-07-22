import bookCover from '@/assets/effects/book/cover.webp'

import { LazyPdfBook } from './books/LazyPdfBook'

import type { ProjectEntry } from './portfolioContentTypes'

/**
 * Modèle non publié à copier lorsqu'un projet documenté est prêt. Son contenu
 * reste descriptif afin de ne pas inventer un projet public.
 */
export const projects = [
  {
    slug: 'project-template',
    title: 'Nemyl, la ville des reflets',
    year: 2026,
    status: 'Brouillon',
    summary: 'Exemple de structure à remplacer par un projet réel documenté.',
    introduction:
      'Ce contenu sert uniquement de modèle éditorial et reste absent du portfolio public.',
    cover: {
      src: bookCover,
      alt: 'Couverture du livre intégré au projet modèle.',
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
        id: 'flipbook',
        type: 'component',
        component: LazyPdfBook,
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
    published: true,
  },
] satisfies readonly ProjectEntry[]
