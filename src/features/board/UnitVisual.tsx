import { X } from 'lucide-react'
import type { Faction, TacticalUnit } from '../../domain'
import { BuiltinIcon } from './BuiltinIcon'
import { statusDetails } from './unitVisualModel'
import styles from './Board.module.css'

export interface UnitVisualProps {
  assetUrl?: string
  faction?: Faction
  unit: TacticalUnit
}

export function UnitVisual({ assetUrl, faction, unit }: UnitVisualProps) {
  const status = statusDetails(unit.status)
  return (
    <>
      <span className={styles.iconFrame}>
        {unit.icon.kind === 'asset' && assetUrl ? (
          <img className={styles.iconImage} src={assetUrl} alt="" draggable={false} />
        ) : (
          <BuiltinIcon
            iconKey={unit.icon.kind === 'catalog' ? unit.icon.name : 'target'}
            aria-hidden
          />
        )}
        <span className={styles.factionBadge} aria-hidden>
          {faction?.name.charAt(0).toUpperCase() ?? '?'}
        </span>
        {status ? (
          <span className={`${styles.statusBadge} ${status.className}`} aria-hidden>
            {status.symbol}
          </span>
        ) : null}
      </span>
      <span className={styles.unitLabel}>{unit.name}</span>
      {unit.status === 'destroyed' ? (
        <span
          aria-hidden="true"
          className={styles.destroyedOverlay}
          data-destroyed-overlay
        >
          <X />
        </span>
      ) : null}
    </>
  )
}
