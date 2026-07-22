import type { ArrowStyle } from './tacticalBoardTypes'

/** Outil actif dans le plateau ; il s’agit d’un état UI, jamais persisté. */
export type BoardTool = 'select' | 'place' | 'arrow' | 'marker' | 'delete' | 'erase'

/** Choix d’interface converti ensuite vers le type de marqueur métier. */
export type MarkerKind = 'objective' | 'warning' | 'rally-point'

export type { ArrowStyle }
