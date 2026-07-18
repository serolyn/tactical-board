import { useEffect, useState } from 'react'
import { Button, Modal } from '../../components'
import type { GridConfig } from '../../domain'
import styles from './BoardSettingsModal.module.css'

export interface BoardSettingsModalProps {
  grid: GridConfig
  onApply: (rows: number, columns: number, showCoordinates: boolean) => void
  onClear: () => void
  onClose: () => void
  open: boolean
  unitCount: number
  annotationCount: number
}

export function BoardSettingsModal({
  grid,
  onApply,
  onClear,
  onClose,
  open,
  unitCount,
  annotationCount,
}: BoardSettingsModalProps) {
  const [rows, setRows] = useState(grid.rows)
  const [columns, setColumns] = useState(grid.columns)
  const [showCoordinates, setShowCoordinates] = useState(grid.showCoordinates)

  useEffect(() => {
    if (!open) return
    setRows(grid.rows)
    setColumns(grid.columns)
    setShowCoordinates(grid.showCoordinates)
  }, [grid, open])

  const valid =
    Number.isInteger(rows) &&
    rows >= 5 &&
    rows <= 20 &&
    Number.isInteger(columns) &&
    columns >= 5 &&
    columns <= 20

  return (
    <Modal
      title="Réglages du plateau"
      description="La grille reste ancrée en A1 lors d’un redimensionnement."
      open={open}
      onClose={onClose}
      size="small"
      footer={
        <>
          <Button
            disabled={!unitCount && !annotationCount}
            onClick={onClear}
            variant="danger"
          >
            Vider le plateau
          </Button>
          <span className={styles.spacer} />
          <Button onClick={onClose} variant="ghost">Annuler</Button>
          <Button
            disabled={!valid}
            onClick={() => onApply(rows, columns, showCoordinates)}
            variant="primary"
          >
            Appliquer
          </Button>
        </>
      }
    >
      <div className={styles.stack}>
        <div className={styles.dimensions}>
          <label className={styles.field}>
            Lignes
            <input
              type="number"
              min={5}
              max={20}
              value={rows}
              onChange={(event) => setRows(Number(event.target.value))}
            />
          </label>
          <label className={styles.field}>
            Colonnes
            <input
              type="number"
              min={5}
              max={20}
              value={columns}
              onChange={(event) => setColumns(Number(event.target.value))}
            />
          </label>
        </div>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={showCoordinates}
            onChange={(event) => setShowCoordinates(event.target.checked)}
          />
          Afficher les coordonnées dans les cases
        </label>
        <p className={styles.info}>
          Contenu actuel : {unitCount} unité{unitCount > 1 ? 's' : ''} et {annotationCount}{' '}
          annotation{annotationCount > 1 ? 's' : ''}. Une réduction peut retirer les éléments hors limites.
        </p>
      </div>
    </Modal>
  )
}
