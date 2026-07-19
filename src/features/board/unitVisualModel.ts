import type { TacticalUnit } from '../../domain'
import styles from './Board.module.css'

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
