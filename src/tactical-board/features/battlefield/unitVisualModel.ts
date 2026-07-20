/**
 * @packageDocumentation
 * Interface du plateau tactique.
 *
 * Ce fichier gère la grille, les unités, les flèches et les marqueurs. Si tu
 * veux comprendre ce que voit l'utilisateur quand il manipule le plateau, c'est
 * ici qu'il faut commencer.
 */

import type { TacticalUnit } from '@/tactical-board/model/tacticalBoardTypes'
import styles from './Battlefield.module.css'
/**
 * Cette fonction intervient sur le sujet “status Details” dans tactical-board.
 *
 * Fichier: src/tactical-board/features/battlefield/unitVisualModel.ts
 * Si tu lis ce fichier pour apprendre, regarde d’abord statusDetails dans unitVisualModel.ts.
 */


export function statusDetails(status: TacticalUnit['status']) {
  if (status === 'wounded') {
    return { symbol: '+', className: styles.statusWounded, label: 'blessée' }
  }
  if (status === 'neutralized') {
    return { symbol: '−', className: styles.statusNeutralized, label: 'neutralisée' }
  }
  if (status === 'destroyed') {
    return { symbol: '×', className: styles.statusDestroyed, label: 'détruite' }
  }
  if (status === 'hidden') {
    return { symbol: '◌', className: styles.statusHidden, label: 'cachée' }
  }
  return null
}
/**
 * Cette fonction intervient sur le sujet “unit Class Name” dans tactical-board.
 *
 * Fichier: src/tactical-board/features/battlefield/unitVisualModel.ts
 * Si tu lis ce fichier pour apprendre, regarde d’abord unitClassName dans unitVisualModel.ts.
 */


export function unitClassName(unit: TacticalUnit, selected: boolean) {
  return [
    styles.unit,
    selected ? styles.unitSelected : '',
    unit.status === 'neutralized' ? styles.unitNeutralized : '',
    unit.status === 'destroyed' ? styles.unitDestroyed : '',
    unit.status === 'hidden' ? styles.unitHidden : '',
  ]
    .filter(Boolean)
    .join(' ')
}
