import { CircleOff, Handshake, MousePointer2, X } from 'lucide-react'

import { Button, PanelShell } from '../../components'
import type { TacticalUnit, UnitStatus } from '../../domain'
import styles from './MultiUnitActionsPanel.module.css'

const STATUS_OPTIONS: ReadonlyArray<{ label: string; value: UnitStatus }> = [
  { label: 'Active', value: 'active' },
  { label: 'Fragilisée', value: 'wounded' },
  { label: 'Neutralisée', value: 'neutralized' },
  { label: 'Détruite', value: 'destroyed' },
  { label: 'Cachée', value: 'hidden' },
]

export interface MultiUnitActionsPanelProps {
  onChangeStatus?: (status: UnitStatus) => void
  onClearSelection: () => void
  onClose?: () => void
  onNeutralize?: () => void
  onRally?: () => void
  open?: boolean
  units: readonly TacticalUnit[]
}

export function MultiUnitActionsPanel({
  onChangeStatus,
  onClearSelection,
  onClose,
  onNeutralize,
  onRally,
  open = true,
  units,
}: MultiUnitActionsPanelProps) {
  const hasActions = Boolean(onChangeStatus || onNeutralize || onRally)
  const visibleNames = units.slice(0, 4)
  const remainingCount = units.length - visibleNames.length

  return (
    <PanelShell
      description={`${units.length} unités sélectionnées`}
      onClose={onClose}
      open={open}
      side="left"
      title="Actions groupées"
    >
      <div className={styles.panelBody}>
        <section className={styles.selectionSection} aria-label="Unités sélectionnées">
          <div className={styles.sectionHeading}>
            <MousePointer2 aria-hidden="true" />
            <h3>Sélection</h3>
          </div>
          <ul className={styles.unitList}>
            {visibleNames.map((unit) => (
              <li key={unit.id}>{unit.name}</li>
            ))}
            {remainingCount > 0 ? <li>+ {remainingCount} autres</li> : null}
          </ul>
        </section>

        {hasActions ? (
          <>
            {onRally || onNeutralize ? (
              <section className={styles.actionSection} aria-label="Actions communes">
                <h3>Actions communes</h3>
                <div className={styles.actionStack}>
                  {onRally ? (
                    <Button
                      icon={<Handshake aria-hidden="true" />}
                      onClick={onRally}
                      variant="primary"
                    >
                      Rallier la sélection
                    </Button>
                  ) : null}
                  {onNeutralize ? (
                    <Button
                      icon={<CircleOff aria-hidden="true" />}
                      onClick={onNeutralize}
                    >
                      Neutraliser la sélection
                    </Button>
                  ) : null}
                </div>
              </section>
            ) : null}

            {onChangeStatus ? (
              <section className={styles.actionSection}>
                <h3>Changer le statut</h3>
                <label className={styles.statusField}>
                  <span>Nouveau statut commun</span>
                  <select
                    aria-label="Nouveau statut commun"
                    defaultValue=""
                    onChange={(event) => {
                      const status = event.target.value as UnitStatus
                      if (!status) return
                      onChangeStatus(status)
                      event.target.value = ''
                    }}
                  >
                    <option value="">Choisir un statut…</option>
                    {STATUS_OPTIONS.map((status) => (
                      <option
                        disabled={units.every((unit) => unit.status === status.value)}
                        key={status.value}
                        value={status.value}
                      >
                        {status.label}
                      </option>
                    ))}
                  </select>
                </label>
                <p className={styles.hint}>
                  Le changement s’applique à toute la sélection et s’annule en une fois.
                </p>
              </section>
            ) : null}
          </>
        ) : (
          <p className={styles.emptyState} role="status">
            Aucune action commune à effectuer
          </p>
        )}

        <div className={styles.footer}>
          <Button
            icon={<X aria-hidden="true" />}
            onClick={onClearSelection}
            variant="ghost"
          >
            Terminer la sélection
          </Button>
        </div>
      </div>
    </PanelShell>
  )
}
