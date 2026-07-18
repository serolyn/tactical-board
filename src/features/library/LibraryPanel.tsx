import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { Check, Pencil, Plus, Trash2, Upload } from 'lucide-react'

import { Button, Modal, PanelShell, Tooltip, UnitGlyph } from '../../components'
import formStyles from '../../components/FormControls.module.css'
import type { Faction, UnitType } from '../../domain'
import styles from './LibraryPanel.module.css'

export interface FactionDraft {
  color: string
  name: string
}

export interface CustomTypeDraft {
  category: string
  color: string
  image: File | null
  name: string
}

export interface LibraryPanelProps {
  activeFactionId: string | null
  activeUnitTypeId: string | null
  factions: readonly Faction[]
  onClose?: () => void
  onCreateCustomType: (draft: CustomTypeDraft) => void | Promise<void>
  onCreateFaction: (draft: FactionDraft) => void | Promise<void>
  onDeleteCustomType: (id: string) => void | Promise<void>
  onDeleteFaction: (id: string) => void | Promise<void>
  onEditCustomType: (id: string, draft: CustomTypeDraft) => void | Promise<void>
  onEditFaction: (id: string, draft: FactionDraft) => void | Promise<void>
  onSelectFaction: (id: string) => void
  onSelectUnitType: (id: string) => void
  open?: boolean
  resolveAssetUrl?: (assetId: string) => string | undefined
  unitTypes: readonly UnitType[]
}

const DEFAULT_FACTION: FactionDraft = { color: '#3b82f6', name: '' }
const DEFAULT_TYPE: CustomTypeDraft = {
  category: 'Personnalisé',
  color: '#6ea8fe',
  image: null,
  name: '',
}
const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i

export function LibraryPanel({
  activeFactionId,
  activeUnitTypeId,
  factions,
  onClose,
  onCreateCustomType,
  onCreateFaction,
  onDeleteCustomType,
  onDeleteFaction,
  onEditCustomType,
  onEditFaction,
  onSelectFaction,
  onSelectUnitType,
  open = true,
  resolveAssetUrl,
  unitTypes,
}: LibraryPanelProps) {
  const [factionDialog, setFactionDialog] = useState<{
    draft: FactionDraft
    id?: string
  } | null>(null)
  const [typeDialog, setTypeDialog] = useState<{
    draft: CustomTypeDraft
    id?: string
    imageUrl?: string
  } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<
    | { id: string; kind: 'faction' | 'type'; name: string }
    | null
  >(null)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const builtInTypes = useMemo(
    () => unitTypes.filter((type) => type.builtin),
    [unitTypes],
  )
  const customTypes = useMemo(
    () => unitTypes.filter((type) => !type.builtin && !type.archived),
    [unitTypes],
  )

  const saveFaction = async () => {
    if (!factionDialog) return
    const draft = { ...factionDialog.draft, name: factionDialog.draft.name.trim() }
    if (!draft.name) {
      setFormError('Donnez un nom à la faction.')
      return
    }
    if (!HEX_COLOR_PATTERN.test(draft.color)) {
      setFormError('Utilisez une couleur hexadécimale au format #RRGGBB.')
      return
    }
    setBusy(true)
    setFormError(null)
    try {
      if (factionDialog.id) await onEditFaction(factionDialog.id, draft)
      else await onCreateFaction(draft)
      setFactionDialog(null)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Impossible d’enregistrer la faction.')
    } finally {
      setBusy(false)
    }
  }

  const saveType = async () => {
    if (!typeDialog) return
    const draft = {
      ...typeDialog.draft,
      category: typeDialog.draft.category.trim(),
      name: typeDialog.draft.name.trim(),
    }
    if (!draft.name || !draft.category) {
      setFormError('Le nom et la catégorie sont obligatoires.')
      return
    }
    if (!HEX_COLOR_PATTERN.test(draft.color)) {
      setFormError('Utilisez une couleur hexadécimale au format #RRGGBB.')
      return
    }
    if (!typeDialog.id && !draft.image) {
      setFormError('Choisissez une image pour le nouveau type.')
      return
    }
    setBusy(true)
    setFormError(null)
    try {
      if (typeDialog.id) await onEditCustomType(typeDialog.id, draft)
      else await onCreateCustomType(draft)
      setTypeDialog(null)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Impossible d’enregistrer le type.')
    } finally {
      setBusy(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setBusy(true)
    try {
      if (deleteTarget.kind === 'faction') await onDeleteFaction(deleteTarget.id)
      else await onDeleteCustomType(deleteTarget.id)
      setDeleteTarget(null)
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Impossible de supprimer cet élément.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PanelShell
        description="Choisissez quoi placer sur le plateau"
        onClose={onClose}
        open={open}
        side="left"
        title="Bibliothèque"
      >
        <section className={styles.section}>
          <div className={styles.sectionHeading}>
            <h3>Faction active</h3>
            <Tooltip label="Créer une faction">
              <Button
                aria-label="Créer une faction"
                icon={<Plus aria-hidden="true" />}
                iconOnly
                onClick={() => {
                  setFormError(null)
                  setFactionDialog({ draft: { ...DEFAULT_FACTION } })
                }}
                variant="ghost"
              />
            </Tooltip>
          </div>
          <div className={styles.factionList} role="radiogroup" aria-label="Faction active">
            {factions.map((faction) => {
              const active = faction.id === activeFactionId
              return (
                <div className={`${styles.factionRow} ${active ? styles.activeRow : ''}`} key={faction.id}>
                  <button
                    aria-checked={active}
                    className={styles.factionChoice}
                    onClick={() => onSelectFaction(faction.id)}
                    role="radio"
                    type="button"
                  >
                    <span className={styles.swatch} style={{ backgroundColor: faction.color }} />
                    <span>{faction.name}</span>
                    {active ? <Check aria-hidden="true" /> : null}
                  </button>
                  <Tooltip label={`Modifier ${faction.name}`} side="left">
                    <Button
                      aria-label={`Modifier ${faction.name}`}
                      icon={<Pencil aria-hidden="true" />}
                      iconOnly
                      onClick={() => {
                        setFormError(null)
                        setFactionDialog({
                          draft: { color: faction.color, name: faction.name },
                          id: faction.id,
                        })
                      }}
                      variant="ghost"
                    />
                  </Tooltip>
                </div>
              )
            })}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeading}>
            <h3>Unités</h3>
            <Tooltip label="Créer un type personnalisé">
              <Button
                aria-label="Créer un type personnalisé"
                icon={<Plus aria-hidden="true" />}
                iconOnly
                onClick={() => {
                  setFormError(null)
                  setTypeDialog({ draft: { ...DEFAULT_TYPE } })
                }}
                variant="ghost"
              />
            </Tooltip>
          </div>
          <TypeGrid
            activeId={activeUnitTypeId}
            onSelect={onSelectUnitType}
            resolveAssetUrl={resolveAssetUrl}
            types={builtInTypes}
          />

          {customTypes.length ? (
            <>
              <h4 className={styles.subheading}>Types personnalisés</h4>
              <TypeGrid
                activeId={activeUnitTypeId}
                onDelete={(type) => {
                  setFormError(null)
                  setDeleteTarget({ id: type.id, kind: 'type', name: type.name })
                }}
                onEdit={(type) => {
                  setFormError(null)
                  setTypeDialog({
                    draft: {
                      category: type.category,
                      color: type.defaultColor,
                      image: null,
                      name: type.name,
                    },
                    id: type.id,
                    imageUrl:
                      type.icon.kind === 'asset'
                        ? resolveAssetUrl?.(type.icon.assetId)
                        : undefined,
                  })
                }}
                onSelect={onSelectUnitType}
                resolveAssetUrl={resolveAssetUrl}
                types={customTypes}
              />
            </>
          ) : (
            <button
              className={styles.emptyCustom}
              onClick={() => setTypeDialog({ draft: { ...DEFAULT_TYPE } })}
              type="button"
            >
              <Upload aria-hidden="true" />
              <span>Importer une image pour créer votre propre type</span>
            </button>
          )}
        </section>
      </PanelShell>

      <FactionEditor
        busy={busy}
        error={formError}
        onChange={(draft) =>
          setFactionDialog((dialog) => (dialog ? { ...dialog, draft } : dialog))
        }
        onClose={() => setFactionDialog(null)}
        onDelete={
          factionDialog?.id
            ? () => {
                const faction = factions.find((item) => item.id === factionDialog.id)
                if (faction) {
                  setFormError(null)
                  setDeleteTarget({ id: faction.id, kind: 'faction', name: faction.name })
                  setFactionDialog(null)
                }
              }
            : undefined
        }
        onSave={() => void saveFaction()}
        state={factionDialog}
      />

      <CustomTypeEditor
        busy={busy}
        error={formError}
        onChange={(draft) =>
          setTypeDialog((dialog) => (dialog ? { ...dialog, draft } : dialog))
        }
        onClose={() => setTypeDialog(null)}
        onSave={() => void saveType()}
        state={typeDialog}
      />

      <Modal
        description={
          deleteTarget?.kind === 'type'
            ? 'Les unités déjà placées conserveront leur apparence.'
            : 'La suppression est refusée si cette faction est encore utilisée.'
        }
        footer={
          <>
            <Button onClick={() => setDeleteTarget(null)} variant="ghost">Annuler</Button>
            <Button loading={busy} onClick={() => void confirmDelete()} variant="danger">
              Supprimer
            </Button>
          </>
        }
        onClose={() => setDeleteTarget(null)}
        open={Boolean(deleteTarget)}
        size="small"
        title={`Supprimer « ${deleteTarget?.name ?? ''} » ?`}
      >
        <p className={styles.dialogText}>Cette action sera ajoutée à l’historique du scénario.</p>
        {formError ? <p className={formStyles.error} role="alert">{formError}</p> : null}
      </Modal>
    </>
  )
}

interface TypeGridProps {
  activeId: string | null
  onDelete?: (type: UnitType) => void
  onEdit?: (type: UnitType) => void
  onSelect: (id: string) => void
  resolveAssetUrl?: (assetId: string) => string | undefined
  types: readonly UnitType[]
}

function TypeGrid({
  activeId,
  onDelete,
  onEdit,
  onSelect,
  resolveAssetUrl,
  types,
}: TypeGridProps) {
  return (
    <div className={styles.typeGrid} role="radiogroup" aria-label="Type d’unité à placer">
      {types.map((type) => {
        const active = type.id === activeId
        return (
          <div className={`${styles.typeTile} ${active ? styles.activeTile : ''}`} key={type.id}>
            <button
              aria-checked={active}
              aria-label={`${type.name}, ${type.category}`}
              className={styles.typeChoice}
              onClick={() => onSelect(type.id)}
              role="radio"
              title={type.name}
              type="button"
            >
              <span
                className={styles.glyphFrame}
                style={{ '--unit-color': type.defaultColor } as React.CSSProperties}
              >
                <UnitGlyph
                  color={type.defaultColor}
                  iconKey={type.icon.kind === 'catalog' ? type.icon.name : type.id}
                  imageUrl={
                    type.icon.kind === 'asset'
                      ? resolveAssetUrl?.(type.icon.assetId)
                      : undefined
                  }
                />
              </span>
              <span className={styles.typeName}>{type.name}</span>
            </button>
            {onEdit || onDelete ? (
              <span className={styles.tileActions}>
                {onEdit ? (
                  <button aria-label={`Modifier ${type.name}`} onClick={() => onEdit(type)} type="button">
                    <Pencil aria-hidden="true" />
                  </button>
                ) : null}
                {onDelete ? (
                  <button aria-label={`Supprimer ${type.name}`} onClick={() => onDelete(type)} type="button">
                    <Trash2 aria-hidden="true" />
                  </button>
                ) : null}
              </span>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

interface FactionEditorProps {
  busy: boolean
  error: string | null
  onChange: (draft: FactionDraft) => void
  onClose: () => void
  onDelete?: () => void
  onSave: () => void
  state: { draft: FactionDraft; id?: string } | null
}

function FactionEditor({ busy, error, onChange, onClose, onDelete, onSave, state }: FactionEditorProps) {
  return (
    <Modal
      footer={
        <>
          {onDelete ? <Button onClick={onDelete} variant="danger">Supprimer</Button> : null}
          <span className={styles.footerSpacer} />
          <Button onClick={onClose} variant="ghost">Annuler</Button>
          <Button disabled={!state?.draft.name.trim()} loading={busy} onClick={onSave} variant="primary">
            Enregistrer
          </Button>
        </>
      }
      onClose={onClose}
      open={Boolean(state)}
      size="small"
      title={state?.id ? 'Modifier la faction' : 'Nouvelle faction'}
    >
      {state ? (
        <div className={styles.formStack}>
          <label className={formStyles.field}>
            <span className={formStyles.label}>Nom</span>
            <input
              autoComplete="off"
              className={formStyles.input}
              maxLength={40}
              onChange={(event) => onChange({ ...state.draft, name: event.target.value })}
              value={state.draft.name}
            />
          </label>
          <label className={formStyles.field}>
            <span className={formStyles.label}>Couleur</span>
            <span className={formStyles.colorRow}>
              <input
                aria-label="Couleur de la faction"
                className={formStyles.color}
                onChange={(event) => onChange({ ...state.draft, color: event.target.value })}
                type="color"
                value={state.draft.color}
              />
              <input
                aria-label="Code couleur de la faction"
                className={formStyles.input}
                onChange={(event) => onChange({ ...state.draft, color: event.target.value })}
                pattern="#[0-9a-fA-F]{6}"
                value={state.draft.color}
              />
            </span>
          </label>
          {error ? <p className={formStyles.error} role="alert">{error}</p> : null}
        </div>
      ) : null}
    </Modal>
  )
}

interface CustomTypeEditorProps {
  busy: boolean
  error: string | null
  onChange: (draft: CustomTypeDraft) => void
  onClose: () => void
  onSave: () => void
  state: { draft: CustomTypeDraft; id?: string; imageUrl?: string } | null
}

function CustomTypeEditor({ busy, error, onChange, onClose, onSave, state }: CustomTypeEditorProps) {
  const [localError, setLocalError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!state?.draft.image) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(state.draft.image)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [state?.draft.image])

  const chooseImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    event.target.value = ''
    if (!file || !state) return
    if (file.size > 5 * 1024 * 1024) {
      setLocalError('L’image dépasse la limite de 5 Mio.')
      return
    }
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(file.type)) {
      setLocalError('Format non pris en charge. Utilisez PNG, JPEG, WebP ou SVG.')
      return
    }
    setLocalError(null)
    onChange({ ...state.draft, image: file })
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    onSave()
  }

  return (
    <Modal
      footer={
        <>
          <Button onClick={onClose} variant="ghost">Annuler</Button>
          <Button
            disabled={!state?.draft.name.trim() || (!state?.id && !state?.draft.image)}
            loading={busy}
            onClick={onSave}
            variant="primary"
          >
            Enregistrer
          </Button>
        </>
      }
      onClose={onClose}
      open={Boolean(state)}
      size="medium"
      title={state?.id ? 'Modifier le type personnalisé' : 'Nouveau type personnalisé'}
    >
      {state ? (
        <form className={styles.customTypeForm} onSubmit={submit}>
          <div className={styles.previewColumn}>
            <div className={`${styles.preview} ${styles.lightPreview}`}>
              {previewUrl || state.imageUrl ? (
                <img alt="Aperçu sur fond clair" src={previewUrl ?? state.imageUrl} />
              ) : (
                <Upload aria-hidden="true" />
              )}
            </div>
            <div className={`${styles.preview} ${styles.darkPreview}`}>
              {previewUrl || state.imageUrl ? (
                <img alt="Aperçu sur fond sombre" src={previewUrl ?? state.imageUrl} />
              ) : (
                <Upload aria-hidden="true" />
              )}
            </div>
          </div>
          <div className={styles.formStack}>
            <label className={formStyles.field}>
              <span className={formStyles.label}>Nom du type</span>
              <input
                autoComplete="off"
                className={formStyles.input}
                maxLength={60}
                onChange={(event) => onChange({ ...state.draft, name: event.target.value })}
                value={state.draft.name}
              />
            </label>
            <label className={formStyles.field}>
              <span className={formStyles.label}>Catégorie</span>
              <input
                autoComplete="off"
                className={formStyles.input}
                maxLength={40}
                onChange={(event) => onChange({ ...state.draft, category: event.target.value })}
                value={state.draft.category}
              />
            </label>
            <label className={formStyles.field}>
              <span className={formStyles.label}>Couleur par défaut</span>
              <span className={formStyles.colorRow}>
                <input
                  aria-label="Couleur par défaut"
                  className={formStyles.color}
                  onChange={(event) => onChange({ ...state.draft, color: event.target.value })}
                  type="color"
                  value={state.draft.color}
                />
                <input
                  aria-label="Code couleur par défaut"
                  className={formStyles.input}
                  onChange={(event) => onChange({ ...state.draft, color: event.target.value })}
                  value={state.draft.color}
                />
              </span>
            </label>
            <label className={`${formStyles.field} ${styles.fileField}`}>
              <span className={formStyles.label}>Image {state.id ? '(facultatif)' : ''}</span>
              <span className={styles.fileButton}>
                <Upload aria-hidden="true" />
                {state.draft.image?.name ?? (state.imageUrl ? 'Remplacer l’image' : 'Choisir une image')}
              </span>
              <input
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={chooseImage}
                type="file"
              />
              <span className={formStyles.hint}>PNG, JPEG, WebP ou SVG · 5 Mio maximum</span>
            </label>
            {localError || error ? (
              <p className={formStyles.error} role="alert">{localError ?? error}</p>
            ) : null}
          </div>
        </form>
      ) : null}
    </Modal>
  )
}
