/**
 * @packageDocumentation
 * Interface du plateau tactique.
 *
 * Ce fichier gère la grille, les unités, les flèches et les marqueurs. Si tu
 * veux comprendre ce que voit l'utilisateur quand il manipule le plateau, c'est
 * ici qu'il faut commencer.
 */

import { X } from 'lucide-react'
import type { Faction, TacticalUnit } from '@/tactical-board/model/tacticalBoardTypes'
import { BuiltinUnitIcon } from './BuiltinUnitIcon'
import { statusDetails } from './unitVisualModel'
import styles from './Battlefield.module.css'

export interface UnitVisualProps {
  assetUrl?: string
  faction?: Faction
  unit: TacticalUnit
}
/**
 * Cette fonction intervient sur le sujet “unit Visual” dans tactical-board.
 *
 * Fichier: src/tactical-board/features/battlefield/UnitVisual.tsx
 * Si tu lis ce fichier pour apprendre, regarde d’abord UnitVisual dans UnitVisual.tsx.
 */


export function UnitVisual({ assetUrl, faction, unit }: UnitVisualProps) {
  const status = statusDetails(unit.status)
  return (
    <>
      <span className={styles.iconFrame}>
        {unit.icon.kind === 'asset' && assetUrl ? (
          <img className={styles.iconImage} src={assetUrl} alt="" draggable={false} />
        ) : (
          <BuiltinUnitIcon
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
