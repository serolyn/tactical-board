/**
 * @packageDocumentation
 * Interface du plateau tactique.
 *
 * Ce fichier gère la grille, les unités, les flèches et les marqueurs. Si tu
 * veux comprendre ce que voit l'utilisateur quand il manipule le plateau, c'est
 * ici qu'il faut commencer.
 */

import type { CSSProperties } from 'react'
import type { Faction, TacticalUnit } from '@/tactical-board/model/tacticalBoardTypes'
import { UnitVisual } from './UnitVisual'
import styles from './Battlefield.module.css'

export interface DragGhostLayerProps {
  assetUrls: Readonly<Record<string, string>>
  factionById: ReadonlyMap<string, Faction>
  translateX: number
  translateY: number
  units: readonly TacticalUnit[]
  valid: boolean
}
/**
 * Cette fonction intervient sur le sujet “drag Ghost Layer” dans tactical-board.
 *
 * Fichier: src/tactical-board/features/battlefield/DragGhostLayer.tsx
 * Si tu lis ce fichier pour apprendre, regarde d’abord DragGhostLayer dans DragGhostLayer.tsx.
 */


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
