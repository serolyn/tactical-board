/**
 * @packageDocumentation
 * Barre et modales de scénario Tactical Board.
 *
 * Ce dossier gère les actions de haut niveau: créer un scénario, passer au
 * suivant, consulter les détails ou suivre la progression. Il relie le métier
 * du board aux actions visibles dans l'interface.
 */

import { useRef, useState, type ChangeEvent } from 'react'
import {
  Archive,
  ArchiveRestore,
  Copy,
  Download,
  FileImage,
  FilePlus2,
  Files,
  Menu,
  MoreHorizontal,
  PanelLeft,
  PanelRight,
  Pencil,
  Redo2,
  Save,
  StepForward,
  Target,
  Trash2,
  Undo2,
  Upload,
} from 'lucide-react'

import formStyles from '@/tactical-board/styles/FormControls.module.css'
import { Button } from '@/tactical-board/ui/Button'
import { Modal } from '@/tactical-board/ui/Modal'
import { SaveStatus, type SaveState } from '@/tactical-board/ui/SaveStatus'
import { Tooltip } from '@/tactical-board/ui/Tooltip'
import styles from './ScenarioTopBar.module.css'

export interface ScenarioOption {
  id: string
  name: string
  status?: 'active' | 'archived'
  updatedAt?: string
}

export interface ScenarioTopBarProps {
  activeScenarioId: string
  canRedo: boolean
  canUndo: boolean
  onCreateScenario: () => void
  onCreateNextScenario?: (sourceScenarioId: string) => void | Promise<void>
  onDeleteScenario: (id: string) => void | Promise<void>
  onDuplicateScenario: (id: string) => void | Promise<void>
  onEditScenarioDetails?: (id: string) => void | Promise<void>
  onExportJson: () => void | Promise<void>
  onExportAllScenarios?: () => void | Promise<void>
  onExportPng: () => void | Promise<void>
  onForceSave: () => void | Promise<void>
  onImportScenario: (file: File) => void | Promise<void>
  onOpenInspector?: () => void
  onOpenLibrary?: () => void
  onRedo: () => void
  onRenameScenario: (id: string, name: string) => void | Promise<void>
  onSelectScenario: (id: string) => void
  onSetScenarioStatus?: (
    id: string,
    status: 'active' | 'archived',
  ) => void | Promise<void>
  onUndo: () => void
  saveDetail?: string
  saveState: SaveState
  scenarios: ScenarioOption[]
}
/**
 * Cette fonction intervient sur le sujet “scenario Top Bar” dans tactical-board.
 *
 * Fichier: src/tactical-board/features/scenarios/ScenarioTopBar.tsx
 * Si tu lis ce fichier pour apprendre, regarde d’abord ScenarioTopBar dans ScenarioTopBar.tsx.
 */


export function ScenarioTopBar({
  activeScenarioId,
  canRedo,
  canUndo,
  onCreateScenario,
  onCreateNextScenario,
  onDeleteScenario,
  onDuplicateScenario,
  onEditScenarioDetails,
  onExportJson,
  onExportAllScenarios,
  onExportPng,
  onForceSave,
  onImportScenario,
  onOpenInspector,
  onOpenLibrary,
  onRedo,
  onRenameScenario,
  onSelectScenario,
  onSetScenarioStatus,
  onUndo,
  saveDetail,
  saveState,
  scenarios,
}: ScenarioTopBarProps) {
  const activeScenario =
    scenarios.find((scenario) => scenario.id === activeScenarioId) ?? scenarios[0]
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [busyAction, setBusyAction] = useState<string | null>(null)

  const run = async (name: string, action: () => void | Promise<void>) => {
    setBusyAction(name)
    try {
      await action()
      setMenuOpen(false)
    } finally {
      setBusyAction(null)
    }
  }

  const openRename = () => {
    setDraftName(activeScenario?.name ?? '')
    setRenameOpen(true)
    setMenuOpen(false)
  }

  const submitRename = async () => {
    const name = draftName.trim()
    if (!activeScenario || !name || name === activeScenario.name) {
      setRenameOpen(false)
      return
    }
    await run('rename', () => onRenameScenario(activeScenario.id, name))
    setRenameOpen(false)
  }

  const handleImport = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) void run('import', () => onImportScenario(file))
  }

  return (
    <>
      <header className={styles.topBar}>
        <div className={styles.brand}>
          <Menu aria-hidden="true" />
          <span>Tactical Board</span>
        </div>

        {onOpenLibrary ? (
          <Tooltip label="Ouvrir la bibliothèque">
            <Button
              aria-label="Ouvrir la bibliothèque"
              className={styles.mobilePanelButton}
              icon={<PanelLeft aria-hidden="true" />}
              iconOnly
              onClick={onOpenLibrary}
              variant="ghost"
            />
          </Tooltip>
        ) : null}

        <div className={styles.scenarioGroup}>
          <label className={styles.srOnly} htmlFor="scenario-selector">
            Scénario actif
          </label>
          <select
            className={styles.scenarioSelect}
            id="scenario-selector"
            onChange={(event) => onSelectScenario(event.target.value)}
            value={activeScenarioId}
          >
            {scenarios.map((scenario) => (
              <option key={scenario.id} value={scenario.id}>
                {scenario.name}{scenario.status === 'archived' ? ' · archivé' : ''}
              </option>
            ))}
          </select>
          <Tooltip label="Nouveau scénario">
            <Button
              aria-label="Nouveau scénario"
              icon={<FilePlus2 aria-hidden="true" />}
              iconOnly
              onClick={onCreateScenario}
              variant="ghost"
            />
          </Tooltip>
          <div className={styles.menuAnchor}>
            <Tooltip label="Actions du scénario">
              <Button
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                aria-label="Actions du scénario"
                icon={<MoreHorizontal aria-hidden="true" />}
                iconOnly
                onClick={() => setMenuOpen((open) => !open)}
                variant="ghost"
              />
            </Tooltip>
            {menuOpen ? (
              <div className={styles.menu} role="menu">
                <button onClick={openRename} role="menuitem" type="button">
                  <Pencil aria-hidden="true" /> Renommer
                </button>
                <button
                  disabled={!activeScenario || busyAction === 'duplicate'}
                  onClick={() =>
                    activeScenario &&
                    void run('duplicate', () => onDuplicateScenario(activeScenario.id))
                  }
                  role="menuitem"
                  type="button"
                >
                  <Copy aria-hidden="true" /> Dupliquer
                </button>
                {onEditScenarioDetails ? (
                  <button
                    disabled={!activeScenario}
                    onClick={() =>
                      activeScenario &&
                      void run('scenario-details', () => onEditScenarioDetails(activeScenario.id))
                    }
                    role="menuitem"
                    type="button"
                  >
                    <Target aria-hidden="true" /> Objectif et période
                  </button>
                ) : null}
                {onCreateNextScenario ? (
                  <button
                    disabled={!activeScenario || busyAction === 'create-next'}
                    onClick={() =>
                      activeScenario &&
                      void run('create-next', () => onCreateNextScenario(activeScenario.id))
                    }
                    role="menuitem"
                    type="button"
                  >
                    <StepForward aria-hidden="true" /> Créer le suivant
                  </button>
                ) : null}
                {onSetScenarioStatus && activeScenario ? (
                  <button
                    disabled={busyAction === 'scenario-status'}
                    onClick={() =>
                      void run('scenario-status', () =>
                        onSetScenarioStatus(
                          activeScenario.id,
                          activeScenario.status === 'archived' ? 'active' : 'archived',
                        ),
                      )
                    }
                    role="menuitem"
                    type="button"
                  >
                    {activeScenario.status === 'archived' ? (
                      <><ArchiveRestore aria-hidden="true" /> Désarchiver</>
                    ) : (
                      <><Archive aria-hidden="true" /> Archiver</>
                    )}
                  </button>
                ) : null}
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    fileInputRef.current?.click()
                  }}
                  role="menuitem"
                  type="button"
                >
                  <Upload aria-hidden="true" /> Importer JSON
                </button>
                <button
                  onClick={() => void run('export-json', onExportJson)}
                  role="menuitem"
                  type="button"
                >
                  <Download aria-hidden="true" /> Exporter JSON
                </button>
                {onExportAllScenarios ? (
                  <button
                    disabled={busyAction === 'export-all'}
                    onClick={() => void run('export-all', onExportAllScenarios)}
                    role="menuitem"
                    type="button"
                  >
                    <Files aria-hidden="true" /> Exporter tous les scénarios
                  </button>
                ) : null}
                <button
                  onClick={() => void run('export-png', onExportPng)}
                  role="menuitem"
                  type="button"
                >
                  <FileImage aria-hidden="true" /> Exporter le plateau en PNG
                </button>
                <span className={styles.menuDivider} />
                <button
                  className={styles.dangerItem}
                  disabled={!activeScenario}
                  onClick={() => {
                    setDeleteOpen(true)
                    setMenuOpen(false)
                  }}
                  role="menuitem"
                  type="button"
                >
                  <Trash2 aria-hidden="true" /> Supprimer
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className={styles.actions}>
          <Tooltip label="Annuler (Ctrl ou ⌘ + Z)">
            <Button
              aria-label="Annuler"
              disabled={!canUndo}
              icon={<Undo2 aria-hidden="true" />}
              iconOnly
              onClick={onUndo}
              variant="ghost"
            />
          </Tooltip>
          <Tooltip label="Rétablir (Ctrl ou ⌘ + Maj + Z)">
            <Button
              aria-label="Rétablir"
              disabled={!canRedo}
              icon={<Redo2 aria-hidden="true" />}
              iconOnly
              onClick={onRedo}
              variant="ghost"
            />
          </Tooltip>
          <Tooltip label="Sauvegarder maintenant (Ctrl ou ⌘ + S)">
            <Button
              aria-label="Sauvegarder maintenant"
              icon={<Save aria-hidden="true" />}
              iconOnly
              loading={busyAction === 'save'}
              onClick={() => void run('save', onForceSave)}
              variant="ghost"
            />
          </Tooltip>
          <SaveStatus detail={saveDetail} state={saveState} />
          {onOpenInspector ? (
            <Tooltip label="Ouvrir l’inspecteur">
              <Button
                aria-label="Ouvrir l’inspecteur"
                className={styles.mobilePanelButton}
                icon={<PanelRight aria-hidden="true" />}
                iconOnly
                onClick={onOpenInspector}
                variant="ghost"
              />
            </Tooltip>
          ) : null}
        </div>

        <input
          accept="application/json,.json"
          className={styles.srOnly}
          onChange={handleImport}
          ref={fileInputRef}
          type="file"
        />
      </header>

      <Modal
        footer={
          <>
            <Button onClick={() => setRenameOpen(false)} variant="ghost">
              Annuler
            </Button>
            <Button
              disabled={!draftName.trim()}
              loading={busyAction === 'rename'}
              onClick={() => void submitRename()}
              variant="primary"
            >
              Enregistrer
            </Button>
          </>
        }
        onClose={() => setRenameOpen(false)}
        open={renameOpen}
        size="small"
        title="Renommer le scénario"
      >
        <label className={formStyles.field}>
          <span className={formStyles.label}>Nom du scénario</span>
          <input
            autoComplete="off"
            className={formStyles.input}
            maxLength={80}
            onChange={(event) => setDraftName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void submitRename()
            }}
            value={draftName}
          />
        </label>
      </Modal>

      <Modal
        description={
          scenarios.length === 1
            ? 'Un nouveau scénario vide sera créé automatiquement.'
            : 'Cette action retire le scénario de cet appareil.'
        }
        footer={
          <>
            <Button onClick={() => setDeleteOpen(false)} variant="ghost">
              Annuler
            </Button>
            <Button
              loading={busyAction === 'delete'}
              onClick={() => {
                if (!activeScenario) return
                void run('delete', () => onDeleteScenario(activeScenario.id)).then(() =>
                  setDeleteOpen(false),
                )
              }}
              variant="danger"
            >
              Supprimer
            </Button>
          </>
        }
        onClose={() => setDeleteOpen(false)}
        open={deleteOpen}
        size="small"
        title={`Supprimer « ${activeScenario?.name ?? 'ce scénario'} » ?`}
      >
        <p className={styles.confirmText}>
          Vérifiez que vous avez exporté les données à conserver. Cette suppression
          ne peut pas être annulée.
        </p>
      </Modal>
    </>
  )
}
