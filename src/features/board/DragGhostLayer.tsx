import type { CSSProperties } from 'react'
import type { Faction, TacticalUnit } from '../../domain'
import { UnitVisual } from './UnitVisual'
import styles from './Board.module.css'

export interface DragGhostLayerProps {
  assetUrls: Readonly<Record<string, string>>
  factionById: ReadonlyMap<string, Faction>
  translateX: number
  translateY: number
  units: readonly TacticalUnit[]
  valid: boolean
}

export function DragGhostLayer({
  assetUrls,
  factionById,
  translateX,
  translateY,
  units,
  valid,
}: DragGhostLayerProps) {
  return (
    <div
      aria-hidden="true"
      className={styles.dragGhostLayer}
      data-png-hide="true"
    >
      {units.map((unit) => {
        const faction = factionById.get(unit.factionId)
        const assetUrl = unit.icon.kind === 'asset' ? assetUrls[unit.icon.assetId] : undefined
        return (
          <div
            className={[
              styles.dragGhost,
              unit.status === 'destroyed' ? styles.unitDestroyed : '',
              valid ? '' : styles.dragGhostInvalid,
            ].filter(Boolean).join(' ')}
            data-drag-ghost={unit.id}
            key={unit.id}
            style={{
              left: `calc(${unit.position.column} * var(--cell-size))`,
              top: `calc(${unit.position.row} * var(--cell-size))`,
              transform: `translate(${translateX}px, ${translateY}px)`,
              '--unit-color': unit.color,
              '--faction-color': faction?.color ?? '#94a3b8',
            } as CSSProperties}
          >
            <UnitVisual assetUrl={assetUrl} faction={faction} unit={unit} />
          </div>
        )
      })}
    </div>
  )
}
