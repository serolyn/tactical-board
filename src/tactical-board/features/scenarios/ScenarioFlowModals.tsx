import { useEffect, useState } from 'react'
import { Archive, Copy, LayoutGrid } from 'lucide-react'
import type { ScenarioPeriod } from '@/tactical-board/model/tacticalBoardTypes'
import formStyles from '@/tactical-board/styles/FormControls.module.css'
import { Button } from '@/tactical-board/ui/Button'
import { Modal } from '@/tactical-board/ui/Modal'
import styles from './ScenarioFlowModals.module.css'

export interface NextScenarioModalProps {
  onChoose: (copyOwnForces: boolean) => void
  onClose: () => void
  open: boolean
  sourceName: string
}

export function NextScenarioModal({
  onChoose,
  onClose,
  open,
  sourceName,
}: NextScenarioModalProps) {
  return (
    <Modal
      description={`Continuer après « ${sourceName} ».`}
      onClose={onClose}
      open={open}
      size="small"
      title="Créer le scénario suivant"
    >
      <div className={styles.choiceGrid}>
        <button className={styles.choice} onClick={() => onChoose(false)} type="button">
          <LayoutGrid aria-hidden />
          <span>
            <strong>Commencer avec un plateau vide</strong>
            <small>Nouvelle situation, sans reprendre les unités actuelles.</small>
          </span>
        </button>
        <button className={styles.choice} onClick={() => onChoose(true)} type="button">
          <Copy aria-hidden />
          <span>
            <strong>Reprendre mes forces</strong>
            <small>Copier uniquement les unités de la faction « Mes forces ».</small>
          </span>
        </button>
      </div>
    </Modal>
  )
}

export interface ObjectiveReachedModalProps {
  onArchiveAndContinue: () => void
  onContinue: () => void
  open: boolean
}

export function ObjectiveReachedModal({
  onArchiveAndContinue,
  onContinue,
  open,
}: ObjectiveReachedModalProps) {
  return (
    <Modal
      description="Le commandant a atteint la position finale."
      footer={
        <>
          <Button onClick={onContinue} variant="ghost">Continuer le scénario</Button>
          <span className={styles.footerSpacer} />
          <Button
            icon={<Archive aria-hidden />}
            onClick={onArchiveAndContinue}
            variant="primary"
          >
            Archiver et créer le suivant
          </Button>
        </>
      }
      onClose={onContinue}
      open={open}
      size="small"
      title="Objectif atteint"
    >
      <p className={styles.reachedText}>
        Vous pouvez continuer à explorer ce plateau ou ouvrir la prochaine étape de la campagne.
      </p>
    </Modal>
  )
}

export interface ProgressDateModalProps {
  current?: string
  onApply: (date: string) => void
  onClose: () => void
  open: boolean
}

export function ProgressDateModal({
  current,
  onApply,
  onClose,
  open,
}: ProgressDateModalProps) {
  return (
    <Modal
      footer={
        <>
          <Button onClick={onClose} variant="ghost">Annuler</Button>
          <Button
            onClick={() => {
              const input = document.querySelector<HTMLInputElement>('#scenario-progress-date')
              if (input?.value) onApply(input.value)
            }}
            variant="primary"
          >
            Avancer
          </Button>
        </>
      }
      onClose={onClose}
      open={open}
      size="small"
      title="Avancer dans la période"
    >
      <label className={styles.progressField} htmlFor="scenario-progress-date">
        Date actuelle du scénario
        <input defaultValue={current?.slice(0, 10)} id="scenario-progress-date" type="date" />
      </label>
    </Modal>
  )
}

export interface ScenarioDetailsModalProps {
  objective: string
  onApply: (objective: string, period?: ScenarioPeriod) => void
  onClose: () => void
  open: boolean
  period?: ScenarioPeriod
}

export function ScenarioDetailsModal({
  objective,
  onApply,
  onClose,
  open,
  period,
}: ScenarioDetailsModalProps) {
  const [objectiveDraft, setObjectiveDraft] = useState(objective)
  const [start, setStart] = useState(period?.start?.slice(0, 10) ?? '')
  const [target, setTarget] = useState(period?.target?.slice(0, 10) ?? '')

  useEffect(() => {
    if (!open) return
    setObjectiveDraft(objective)
    setStart(period?.start?.slice(0, 10) ?? '')
    setTarget(period?.target?.slice(0, 10) ?? '')
  }, [objective, open, period?.start, period?.target])

  const valid = !start || !target || target >= start

  return (
    <Modal
      description="Ces informations restent discrètes au-dessus du plateau."
      footer={
        <>
          <Button onClick={onClose} variant="ghost">Annuler</Button>
          <Button
            disabled={!valid}
            onClick={() => {
              const previousCurrent = period?.current?.slice(0, 10)
              const current =
                previousCurrent &&
                (!start || previousCurrent >= start) &&
                (!target || previousCurrent <= target)
                  ? previousCurrent
                  : start || undefined
              const nextPeriod: ScenarioPeriod | undefined =
                start || target
                  ? {
                      ...(start ? { start } : {}),
                      ...(target ? { target } : {}),
                      ...(current ? { current } : {}),
                    }
                  : undefined
              onApply(objectiveDraft.trim(), nextPeriod)
            }}
            variant="primary"
          >
            Enregistrer
          </Button>
        </>
      }
      onClose={onClose}
      open={open}
      size="small"
      title="Objectif et période"
    >
      <div className={styles.detailsStack}>
        <label className={formStyles.field}>
          <span className={formStyles.label}>Objectif court</span>
          <input
            className={formStyles.input}
            maxLength={180}
            onChange={(event) => setObjectiveDraft(event.target.value)}
            placeholder="Le résultat à atteindre"
            value={objectiveDraft}
          />
        </label>
        <fieldset className={formStyles.fieldset}>
          <legend className={formStyles.legend}>Période facultative</legend>
          <div className={styles.dateGrid}>
            <label className={formStyles.field}>
              <span className={formStyles.label}>Début</span>
              <input
                className={formStyles.input}
                onChange={(event) => setStart(event.target.value)}
                type="date"
                value={start}
              />
            </label>
            <label className={formStyles.field}>
              <span className={formStyles.label}>Échéance</span>
              <input
                className={formStyles.input}
                min={start || undefined}
                onChange={(event) => setTarget(event.target.value)}
                type="date"
                value={target}
              />
            </label>
          </div>
        </fieldset>
      </div>
    </Modal>
  )
}
