import { useEffect, useMemo, useState, type KeyboardEvent } from 'react'
import {
  ArrowRight,
  CircleOff,
  Crosshair,
  EyeOff,
  Handshake,
  MapPin,
  MousePointer2,
  ShieldAlert,
  Skull,
  Trash2,
  X,
} from 'lucide-react'

import { Button, PanelShell, UnitGlyph } from '../../components'
import formStyles from '../../components/FormControls.module.css'
import type {
  AnnotationChanges,
  ArrowStyle,
  BoardAnnotation,
  Faction,
  IconRef,
  MarkerType,
  TacticalUnit,
  UnitEditableChanges,
  UnitStatus,
  UnitType,
} from '../../domain'
import styles from './InspectorPanel.module.css'

const STATUS_OPTIONS: ReadonlyArray<{
  description: string
  icon: typeof ShieldAlert
  label: string
  value: UnitStatus
}> = [
  { description: 'Prête à agir', icon: ShieldAlert, label: 'Active', value: 'active' },
  { description: 'Capacité réduite', icon: ShieldAlert, label: 'Fragilisée', value: 'wounded' },
  { description: 'Obstacle écarté', icon: CircleOff, label: 'Neutralisée', value: 'neutralized' },
  { description: 'Hors de combat', icon: Skull, label: 'Détruite', value: 'destroyed' },
  { description: 'Discrète sur le plan', icon: EyeOff, label: 'Cachée', value: 'hidden' },
]

const ARROW_STYLE_LABELS: Record<ArrowStyle, string> = {
  attack: 'Attaque / menace',
  movement: 'Route / déplacement',
  support: 'Soutien',
}

const ARROW_STYLE_COLORS: Record<ArrowStyle, string> = {
  attack: '#ef4444',
  movement: '#f6ba5b',
  support: '#3b82f6',
}

const MARKER_TYPE_LABELS: Record<MarkerType, string> = {
  danger: 'Danger',
  objective: 'Objectif',
  rally: 'Regroupement',
}

export interface InspectorPanelProps {
  annotation?: BoardAnnotation | null
  factions: readonly Faction[]
  onChangeUnitType: (unitId: string, typeId: string) => void
  onClearUnitsSelection?: () => void
  onClose?: () => void
  onDeleteAnnotation?: (annotationId: string) => void
  onDeleteUnit: (unitId: string) => void
  onNeutralizeUnit?: (unitId: string) => void
  onNeutralizeUnits?: () => void
  onRallyUnit?: (unitId: string) => void
  onRallyUnits?: () => void
  onUpdateAnnotation?: (annotationId: string, changes: AnnotationChanges) => void
  onUpdateUnit: (unitId: string, changes: UnitEditableChanges) => void
  onUpdateUnitsStatus?: (status: UnitStatus) => void
  open?: boolean
  resolveAssetUrl?: (assetId: string) => string | undefined
  unit?: TacticalUnit | null
  units?: readonly TacticalUnit[]
  unitTypes: readonly UnitType[]
}

export function InspectorPanel({
  annotation,
  factions,
  onChangeUnitType,
  onClearUnitsSelection,
  onClose,
  onDeleteAnnotation,
  onDeleteUnit,
  onNeutralizeUnit,
  onNeutralizeUnits,
  onRallyUnit,
  onRallyUnits,
  onUpdateAnnotation,
  onUpdateUnit,
  onUpdateUnitsStatus,
  open = true,
  resolveAssetUrl,
  unit,
  units = [],
  unitTypes,
}: InspectorPanelProps) {
  const multiUnits = units.length >= 2 ? units : null
  const title = multiUnits
    ? 'Inspecteur'
    : unit
      ? 'Propriétés de l’unité'
      : annotation
        ? 'Annotation'
        : 'Inspecteur'
  const description = multiUnits
    ? `${multiUnits.length} unités sélectionnées`
    : unit
    ? `${positionLabel(unit.position)} · ${unit.typeSnapshot.name}`
    : annotation
      ? annotation.kind === 'arrow'
        ? `${positionLabel(annotation.start)} → ${positionLabel(annotation.end)}`
        : positionLabel(annotation.position)
      : 'Sélectionnez un élément sur le plateau'

  return (
    <PanelShell
      description={description}
      onClose={onClose}
      open={open}
      side="right"
      title={title}
    >
      {multiUnits ? (
        <MultiUnitInspector
          onClearSelection={onClearUnitsSelection}
          onNeutralize={onNeutralizeUnits}
          onRally={onRallyUnits}
          onUpdateStatus={onUpdateUnitsStatus}
          units={multiUnits}
        />
      ) : unit ? (
        <UnitInspector
          factions={factions}
          onChangeType={(typeId) => onChangeUnitType(unit.id, typeId)}
          onDelete={() => onDeleteUnit(unit.id)}
          onNeutralize={onNeutralizeUnit ? () => onNeutralizeUnit(unit.id) : undefined}
          onRally={onRallyUnit ? () => onRallyUnit(unit.id) : undefined}
          onUpdate={(changes) => onUpdateUnit(unit.id, changes)}
          resolveAssetUrl={resolveAssetUrl}
          unit={unit}
          unitTypes={unitTypes}
        />
      ) : annotation ? (
        <AnnotationInspector
          annotation={annotation}
          onDelete={onDeleteAnnotation ? () => onDeleteAnnotation(annotation.id) : undefined}
          onUpdate={
            onUpdateAnnotation
              ? (changes) => onUpdateAnnotation(annotation.id, changes)
              : undefined
          }
        />
      ) : (
        <EmptyInspector />
      )}
    </PanelShell>
  )
}

interface MultiUnitInspectorProps {
  onClearSelection?: () => void
  onNeutralize?: () => void
  onRally?: () => void
  onUpdateStatus?: (status: UnitStatus) => void
  units: readonly TacticalUnit[]
}

function MultiUnitInspector({
  onClearSelection,
  onNeutralize,
  onRally,
  onUpdateStatus,
  units,
}: MultiUnitInspectorProps) {
  const hasActions = Boolean(onNeutralize || onRally || onUpdateStatus)
  const visibleUnits = units.slice(0, 4)
  const remainingCount = units.length - visibleUnits.length

  return (
    <div className={`${styles.inspector} ${styles.multiInspector}`}>
      <div className={styles.multiSummary}>
        <MousePointer2 aria-hidden="true" />
        <div>
          <h3>Actions groupées</h3>
          <span>Toutes les modifications concernent la sélection entière.</span>
        </div>
      </div>

      <section className={styles.section} aria-label="Unités sélectionnées">
        <h3>Sélection</h3>
        <ul className={styles.multiUnitList}>
          {visibleUnits.map((selectedUnit) => (
            <li key={selectedUnit.id}>{selectedUnit.name}</li>
          ))}
          {remainingCount > 0 ? <li>+ {remainingCount} autres</li> : null}
        </ul>
      </section>

      {hasActions ? (
        <>
          {onRally || onNeutralize ? (
            <section className={styles.section} aria-label="Actions communes">
              <h3>Actions communes</h3>
              <div className={styles.multiActionStack}>
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

          {onUpdateStatus ? (
            <section className={styles.section}>
              <h3>Changer le statut</h3>
              <label className={styles.multiStatusField}>
                <span>Nouveau statut commun</span>
                <select
                  aria-label="Nouveau statut commun"
                  defaultValue=""
                  onChange={(event) => {
                    const status = event.target.value as UnitStatus
                    if (!status) return
                    onUpdateStatus(status)
                    event.target.value = ''
                  }}
                >
                  <option value="">Choisir un statut…</option>
                  {STATUS_OPTIONS.map((status) => (
                    <option
                      disabled={units.every((selectedUnit) => selectedUnit.status === status.value)}
                      key={status.value}
                      value={status.value}
                    >
                      {status.label}
                    </option>
                  ))}
                </select>
              </label>
              <p className={styles.multiHint}>
                Le changement s’annule en une seule fois.
              </p>
            </section>
          ) : null}
        </>
      ) : (
        <p className={styles.multiEmpty} role="status">
          Aucune action commune à effectuer
        </p>
      )}

      {onClearSelection ? (
        <div className={styles.multiFooter}>
          <Button
            icon={<X aria-hidden="true" />}
            onClick={onClearSelection}
            variant="ghost"
          >
            Terminer la sélection
          </Button>
        </div>
      ) : null}
    </div>
  )
}

interface UnitInspectorProps {
  factions: readonly Faction[]
  onChangeType: (typeId: string) => void
  onDelete: () => void
  onNeutralize?: () => void
  onRally?: () => void
  onUpdate: (changes: UnitEditableChanges) => void
  resolveAssetUrl?: (assetId: string) => string | undefined
  unit: TacticalUnit
  unitTypes: readonly UnitType[]
}

function UnitInspector({
  factions,
  onChangeType,
  onDelete,
  onNeutralize,
  onRally,
  onUpdate,
  resolveAssetUrl,
  unit,
  unitTypes,
}: UnitInspectorProps) {
  const availableTypes = useMemo(
    () => unitTypes.filter((type) => type.builtin || !type.archived),
    [unitTypes],
  )
  const currentFaction = factions.find((faction) => faction.id === unit.factionId)
  const imageUrl = unit.icon.kind === 'asset' ? resolveAssetUrl?.(unit.icon.assetId) : undefined

  const iconOptions = useMemo(() => {
    const options = new Map<string, { icon: IconRef; label: string }>()
    for (const type of availableTypes) {
      options.set(iconValue(type.icon), { icon: type.icon, label: type.name })
    }
    options.set(iconValue(unit.icon), { icon: unit.icon, label: 'Icône actuelle' })
    return [...options.entries()]
  }, [availableTypes, unit.icon])

  return (
    <div className={styles.inspector}>
      <div
        className={`${styles.unitPreview} ${styles[`status_${unit.status}`]}`}
        style={{ '--faction-color': currentFaction?.color ?? unit.color } as React.CSSProperties}
      >
        <div className={styles.previewGlyph}>
          <UnitGlyph
            color={unit.color}
            iconKey={unit.icon.kind === 'catalog' ? unit.icon.name : unit.typeId}
            imageUrl={imageUrl}
          />
        </div>
        <div className={styles.previewText}>
          <strong>{unit.name || unit.typeSnapshot.name}</strong>
          <span>{currentFaction?.name ?? 'Faction inconnue'}</span>
        </div>
        <span className={styles.statusBadge}>
          {STATUS_OPTIONS.find((status) => status.value === unit.status)?.label}
        </span>
      </div>

      <section className={styles.section}>
        <h3>Identité</h3>
        <div className={styles.formStack}>
          <CommitTextField
            label="Nom individuel"
            maxLength={60}
            onCommit={(name) => onUpdate({ name })}
            placeholder={unit.typeSnapshot.name}
            value={unit.name}
          />
          <label className={formStyles.field}>
            <span className={formStyles.label}>Type</span>
            <select
              className={formStyles.select}
              onChange={(event) => onChangeType(event.target.value)}
              value={unit.typeId}
            >
              {!availableTypes.some((type) => type.id === unit.typeId) ? (
                <option value={unit.typeId}>{unit.typeSnapshot.name} (archivé)</option>
              ) : null}
              {availableTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </label>
          <label className={formStyles.field}>
            <span className={formStyles.label}>Faction</span>
            <select
              className={formStyles.select}
              onChange={(event) => onUpdate({ factionId: event.target.value })}
              value={unit.factionId}
            >
              {factions.map((faction) => (
                <option key={faction.id} value={faction.id}>
                  {faction.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className={styles.section}>
        <h3>Icône</h3>
        <label className={formStyles.field}>
          <span className={formStyles.label}>Icône ou image</span>
          <select
            className={formStyles.select}
            onChange={(event) => {
              const next = iconOptions.find(([value]) => value === event.target.value)?.[1]
              if (next) onUpdate({ icon: next.icon })
            }}
            value={iconValue(unit.icon)}
          >
            {iconOptions.map(([value, option]) => (
              <option key={value} value={value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className={styles.section}>
        <h3>Statut</h3>
        <div className={styles.statusGrid} role="radiogroup" aria-label="Statut de l’unité">
          {STATUS_OPTIONS.map((status) => {
            const Icon = status.icon
            const selected = unit.status === status.value
            return (
              <button
                aria-checked={selected}
                className={selected ? styles.selectedStatus : ''}
                key={status.value}
                onClick={() => onUpdate({ status: status.value })}
                role="radio"
                type="button"
              >
                <Icon aria-hidden="true" />
                <span>
                  <strong>{status.label}</strong>
                  <small>{status.description}</small>
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {onRally || onNeutralize ? (
        <section className={styles.contextActions} aria-label="Actions contextuelles">
          {onRally ? (
            <Button icon={<Handshake aria-hidden="true" />} onClick={onRally} variant="primary">
              Rallier
            </Button>
          ) : null}
          {onNeutralize ? (
            <Button icon={<CircleOff aria-hidden="true" />} onClick={onNeutralize} variant="secondary">
              Neutraliser
            </Button>
          ) : null}
        </section>
      ) : null}

      <div className={styles.dangerZone}>
        <Button icon={<Trash2 aria-hidden="true" />} onClick={onDelete} variant="danger">
          Retirer du plateau
        </Button>
      </div>
    </div>
  )
}

interface AnnotationInspectorProps {
  annotation: BoardAnnotation
  onDelete?: () => void
  onUpdate?: (changes: AnnotationChanges) => void
}

function AnnotationInspector({ annotation, onDelete, onUpdate }: AnnotationInspectorProps) {
  return (
    <div className={styles.inspector}>
      <div className={styles.annotationSummary}>
        {annotation.kind === 'arrow' ? <ArrowRight aria-hidden="true" /> : <MapPin aria-hidden="true" />}
        <div>
          <strong>{annotation.kind === 'arrow' ? 'Flèche tactique' : 'Marqueur'}</strong>
          <span>
            {annotation.kind === 'arrow'
              ? `${positionLabel(annotation.start)} → ${positionLabel(annotation.end)}`
              : positionLabel(annotation.position)}
          </span>
        </div>
      </div>
      <section className={styles.section}>
        <h3>Style</h3>
        <div className={styles.formStack}>
          {annotation.kind === 'arrow' ? (
            <label className={formStyles.field}>
              <span className={formStyles.label}>Style de flèche</span>
              <select
                className={formStyles.select}
                disabled={!onUpdate}
                onChange={(event) => {
                  const style = event.target.value as ArrowStyle
                  onUpdate?.({ color: ARROW_STYLE_COLORS[style], kind: 'arrow', style })
                }}
                value={annotation.style}
              >
                {Object.entries(ARROW_STYLE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
          ) : (
            <>
              <ColorField
                label="Couleur"
                onCommit={(color) => onUpdate?.({ color, kind: 'marker' })}
                value={annotation.color}
              />
              <label className={formStyles.field}>
                <span className={formStyles.label}>Type de marqueur</span>
                <select
                  className={formStyles.select}
                  disabled={!onUpdate}
                  onChange={(event) =>
                    onUpdate?.({ kind: 'marker', markerType: event.target.value as MarkerType })
                  }
                  value={annotation.markerType}
                >
                  {Object.entries(MARKER_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
              <CommitTextField
                disabled={!onUpdate}
                label="Libellé"
                maxLength={50}
                onCommit={(label) => onUpdate?.({ kind: 'marker', label })}
                value={annotation.label}
              />
            </>
          )}
        </div>
      </section>
      {onDelete ? (
        <div className={styles.dangerZone}>
          <Button icon={<Trash2 aria-hidden="true" />} onClick={onDelete} variant="danger">
            Effacer l’annotation
          </Button>
        </div>
      ) : null}
    </div>
  )
}

interface CommitTextFieldProps {
  disabled?: boolean
  label: string
  maxLength?: number
  multiline?: boolean
  onCommit: (value: string) => void
  placeholder?: string
  value: string
}

function CommitTextField({
  disabled,
  label,
  maxLength,
  multiline,
  onCommit,
  placeholder,
  value,
}: CommitTextFieldProps) {
  const [draft, setDraft] = useState(value)
  useEffect(() => setDraft(value), [value])

  const commit = () => {
    const next = draft.trim()
    if (next !== value) onCommit(next)
  }
  const keyDown = (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!multiline && event.key === 'Enter') {
      event.preventDefault()
      event.currentTarget.blur()
    }
    if (event.key === 'Escape') {
      setDraft(value)
      event.currentTarget.blur()
    }
  }

  const common = {
    disabled,
    maxLength,
    onBlur: commit,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setDraft(event.target.value),
    onKeyDown: keyDown,
    placeholder,
    value: draft,
  }

  return (
    <label className={formStyles.field}>
      <span className={formStyles.label}>{label}</span>
      {multiline ? (
        <textarea className={formStyles.textarea} rows={4} {...common} />
      ) : (
        <input autoComplete="off" className={formStyles.input} {...common} />
      )}
    </label>
  )
}

interface ColorFieldProps {
  label: string
  onCommit: (value: string) => void
  value: string
}

function ColorField({ label, onCommit, value }: ColorFieldProps) {
  const [draft, setDraft] = useState(value)
  useEffect(() => setDraft(value), [value])

  const commit = () => {
    if (/^#[0-9a-f]{6}$/i.test(draft) && draft !== value) onCommit(draft)
    else setDraft(value)
  }

  return (
    <label className={formStyles.field}>
      <span className={formStyles.label}>{label}</span>
      <span className={formStyles.colorRow}>
        <input
          aria-label={label}
          className={formStyles.color}
          onChange={(event) => setDraft(event.target.value)}
          onInput={(event) => setDraft(event.currentTarget.value)}
          onBlur={commit}
          type="color"
          value={draft}
        />
        <input
          aria-label={`Code ${label.toLowerCase()}`}
          className={formStyles.input}
          onBlur={commit}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur()
            if (event.key === 'Escape') {
              setDraft(value)
              event.currentTarget.blur()
            }
          }}
          value={draft}
        />
      </span>
    </label>
  )
}

function EmptyInspector() {
  return (
    <div className={styles.empty}>
      <Crosshair aria-hidden="true" />
      <strong>Aucune sélection</strong>
      <p>Sélectionnez une unité, une flèche ou un marqueur pour modifier ses propriétés.</p>
    </div>
  )
}

function iconValue(icon: IconRef) {
  return icon.kind === 'catalog' ? `catalog:${icon.name}` : `asset:${icon.assetId}`
}

function positionLabel(position: { row: number; column: number }) {
  return `${String.fromCharCode(65 + position.column)}${position.row + 1}`
}
