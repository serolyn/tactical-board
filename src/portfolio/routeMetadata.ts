export type RouteMetadata = {
  title: string
  description: string
}

const fallbackMetadata: RouteMetadata = {
  title: 'Page introuvable — SEROLYN',
  description: "Cette trajectoire n'existe pas encore dans la cartographie de SEROLYN.",
}

export const routeMetadata: Readonly<Record<string, RouteMetadata>> = {
  '/': {
    title: 'SEROLYN — Code, image et musique',
    description: 'Code, image et musique pour cartographier le chaos.',
  },
  '/projects': {
    title: 'Projets — SEROLYN',
    description: 'Des outils et des formes où le code devient un territoire à explorer.',
  },
  '/projects/tactical-board': {
    title: 'Tactical Board — SEROLYN',
    description:
      'Une cartographie interactive où projets, obstacles, ressources et objectifs deviennent forces, fronts et trajectoires.',
  },
  '/board': {
    title: 'Tactical Board — Éditeur tactique',
    description: 'Tactical Board, éditeur de scénarios et de stratégies tactiques sur grille.',
  },
  '/music': {
    title: 'Musique — SEROLYN',
    description: 'Un espace pour les matières sonores, les rythmes et les fragments en devenir.',
  },
  '/lab': {
    title: 'Laboratoire — SEROLYN',
    description: "Expérimentations, apprentissages et traces laissées par le travail en cours.",
  },
  '/about': {
    title: 'À propos — SEROLYN',
    description: 'SEROLYN explore les points de contact entre code, image et musique.',
  },
}

function normalizePathname(pathname: string) {
  if (pathname === '/') return pathname
  return pathname.replace(/\/+$/, '')
}

export function getRouteMetadata(pathname: string): RouteMetadata {
  return routeMetadata[normalizePathname(pathname)] ?? fallbackMetadata
}
