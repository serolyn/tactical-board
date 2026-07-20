/**
 * @packageDocumentation
 * Assets et résolveurs de ressources Tactical Board.
 *
 * Ce dossier aide l'application à retrouver ses icônes et textures locales.
 * Il ne dessine rien directement, il prépare juste les URLs correctes.
 */

import baseIconUrl from './base-icon-game.png'
import obstacleIconUrl from './obstacle-icon-game.png'

const BUILTIN_UNIT_ICON_IMAGES: Readonly<Record<string, string>> = Object.freeze({
  base: baseIconUrl,
  obstacle: obstacleIconUrl,
  'triangle-alert': obstacleIconUrl,
  warehouse: baseIconUrl,
})
/**
 * Cette fonction intervient sur le sujet “resolve Builtin Unit Icon Image” dans tactical-board.
 *
 * Fichier: src/tactical-board/assets/resolveBuiltinUnitIcon.ts
 * Si tu lis ce fichier pour apprendre, regarde d’abord resolveBuiltinUnitIconImage dans resolveBuiltinUnitIcon.ts.
 */


export function resolveBuiltinUnitIconImage(iconKey: string): string | undefined {
  const normalized = iconKey.trim().toLowerCase().replaceAll('_', '-').replaceAll(' ', '-')
  return BUILTIN_UNIT_ICON_IMAGES[normalized]
}
