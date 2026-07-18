import { useEffect, useState } from 'react'
import { Button, Modal } from '../../components'
import styles from './NewScenarioModal.module.css'

export interface NewScenarioModalProps {
  onClose: () => void
  onCreate: (
    name: string,
    rows: number,
    columns: number,
    metadata?: NewScenarioMetadata,
  ) => void
  open: boolean
}

export interface NewScenarioMetadata {
  objective?: string
  period?: {
    start?: string
    target?: string
  }
}

export function NewScenarioModal({ onClose, onCreate, open }: NewScenarioModalProps) {
  const [name, setName] = useState('Nouveau scénario')
  const [rows, setRows] = useState(20)
  const [columns, setColumns] = useState(20)
  const [objective, setObjective] = useState('')
  const [periodStart, setPeriodStart] = useState('')
  const [periodTarget, setPeriodTarget] = useState('')

  useEffect(() => {
    if (!open) return
    setName('Nouveau scénario')
    setRows(20)
    setColumns(20)
    setObjective('')
    setPeriodStart('')
    setPeriodTarget('')
  }, [open])

  const valid =
    name.trim().length > 0 &&
    Number.isInteger(rows) &&
    rows >= 5 &&
    rows <= 20 &&
    Number.isInteger(columns) &&
    columns >= 5 &&
    columns <= 20 &&
    (!periodStart || !periodTarget || periodTarget >= periodStart)

  return (
    <Modal
      title="Nouveau scénario"
      description="Créez un plateau autonome avec les cinq factions tactiques."
      open={open}
      onClose={onClose}
      size="small"
      footer={
        <>
          <Button onClick={onClose} variant="ghost">Annuler</Button>
          <Button
            disabled={!valid}
            onClick={() =>
              onCreate(name.trim(), rows, columns, {
                objective: objective.trim() || undefined,
                period:
                  periodStart || periodTarget
                    ? {
                        start: periodStart || undefined,
                        target: periodTarget || undefined,
                      }
                    : undefined,
              })
            }
            variant="primary"
          >
            Créer
          </Button>
        </>
      }
    >
      <div className={styles.stack}>
        <label className={styles.field}>
          Nom du scénario
          <input
            autoFocus
            maxLength={80}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <div className={styles.dimensions}>
          <label className={styles.field}>
            Lignes
            <input type="number" min={5} max={20} value={rows} onChange={(event) => setRows(Number(event.target.value))} />
          </label>
          <label className={styles.field}>
            Colonnes
            <input type="number" min={5} max={20} value={columns} onChange={(event) => setColumns(Number(event.target.value))} />
          </label>
        </div>
        <label className={styles.field}>
          Objectif <span className={styles.optional}>facultatif</span>
          <input
            maxLength={180}
            onChange={(event) => setObjective(event.target.value)}
            placeholder="Un résultat concret à atteindre"
            value={objective}
          />
        </label>
        <fieldset className={styles.period}>
          <legend>Période <span className={styles.optional}>facultative</span></legend>
          <div className={styles.dimensions}>
            <label className={styles.field}>
              Début
              <input
                onChange={(event) => setPeriodStart(event.target.value)}
                type="date"
                value={periodStart}
              />
            </label>
            <label className={styles.field}>
              Échéance
              <input
                min={periodStart || undefined}
                onChange={(event) => setPeriodTarget(event.target.value)}
                type="date"
                value={periodTarget}
              />
            </label>
          </div>
        </fieldset>
      </div>
    </Modal>
  )
}
