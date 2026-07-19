export type RouteMetadata = {
  title: string
  description: string
}

const fallbackMetadata: RouteMetadata = {
  title: 'Page introuvable — SEROLYN',
  description: 'Cette entrée est introuvable, non publiée ou encore en cours de documentation.',
}

export const routeMetadata: Readonly<Record<string, RouteMetadata>> = {
  '/': {
    title: 'SEROLYN — Entre plusieurs vies',
    description: 'Code, sons et systèmes pour donner une forme à ce qui flotte.',
  },
  '/projects': {
    title: 'Projets — SEROLYN',
    description: 'Réalisations construites ou documentées dans l’univers SEROLYN.',
  },
  '/projects/tactical-board': {
    title: 'Tactical Board — Lab SEROLYN',
    description:
      'Un système interactif où projets, obstacles, ressources et objectifs deviennent forces, fronts et trajectoires.',
  },
  '/board': {
    title: 'Tactical Board — Éditeur tactique',
    description: 'Tactical Board, éditeur de scénarios et de stratégies tactiques sur grille.',
  },
  '/music': {
    title: 'Scènes sonores — SEROLYN',
    description: 'Chaque morceau est un lieu émotionnel à habiter.',
  },
  '/lab': {
    title: 'Lab — SEROLYN',
    description: 'Études, erreurs et expériences construites au fil de l’apprentissage.',
  },
  '/lab/tactical-board': {
    title: 'Tactical Board — Lab SEROLYN',
    description:
      'Un système interactif où projets, obstacles, ressources et objectifs deviennent forces, fronts et trajectoires.',
  },
  '/lab/signal-fantome': {
    title: 'Signal fantôme — Lab SEROLYN',
    description:
      'Une direction visuelle nocturne située entre archive personnelle, morceau ambient et système numérique.',
  },
  '/about': {
    title: 'À propos — SEROLYN',
    description: 'Je construis entre code, son et image.',
  },
}

function normalizePathname(pathname: string) {
  if (pathname === '/') return pathname
  return pathname.replace(/\/+$/, '')
}

export function getRouteMetadata(pathname: string): RouteMetadata {
  return routeMetadata[normalizePathname(pathname)] ?? fallbackMetadata
}
