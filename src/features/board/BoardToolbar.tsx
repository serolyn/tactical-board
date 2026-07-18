import {
  Crosshair,
  Eraser,
  Flag,
  Handshake,
  MousePointer2,
  MoveRight,
  Route,
  ShieldPlus,
  Trash2,
} from 'lucide-react'
import type { ComponentType, CSSProperties } from 'react'
import styles from './BoardToolbar.module.css'

export type BoardTool = 'select' | 'place' | 'arrow' | 'marker' | 'delete' | 'erase'
export type ArrowStyle = 'attack' | 'movement' | 'support'
export type MarkerKind = 'objective' | 'warning' | 'rally-point'

interface ToolDefinition {
  id: BoardTool
  label: string
  shortcut?: string
  icon: ComponentType<{ 'aria-hidden'?: boolean }>
}

const TOOLS: ToolDefinition[] = [
  { id: 'select', label: 'Sélection', icon: MousePointer2 },
  { id: 'place', label: 'Placement', icon: ShieldPlus },
  { id: 'arrow', label: 'Flèche', icon: MoveRight },
  { id: 'marker', label: 'Marqueur', icon: Flag },
  { id: 'delete', label: 'Supprimer', shortcut: 'Suppr', icon: Trash2 },
  { id: 'erase', label: 'Gomme', icon: Eraser },
]

const ARROW_PRESETS: ReadonlyArray<{
  color: string
  icon: ComponentType<{ 'aria-hidden'?: boolean }>
  label: string
  style: ArrowStyle
}> = [
  { color: '#ef4444', icon: Crosshair, label: 'Attaque / menace', style: 'attack' },
  { color: '#3b82f6', icon: Handshake, label: 'Soutien', style: 'support' },
  { color: '#f6ba5b', icon: Route, label: 'Route / déplacement', style: 'movement' },
]

export interface BoardToolbarProps {
  tool: BoardTool
  onToolChange: (tool: BoardTool) => void
  canPlace: boolean
  arrowStyle: ArrowStyle
  arrowColor: string
  markerKind: MarkerKind
  markerColor: string
  onArrowStyleChange: (style: ArrowStyle) => void
  onArrowColorChange: (color: string) => void
  onMarkerKindChange: (kind: MarkerKind) => void
  onMarkerColorChange: (color: string) => void
}

export function BoardToolbar({
  tool,
  onToolChange,
  canPlace,
  arrowStyle,
  markerKind,
  markerColor,
  onArrowStyleChange,
  onArrowColorChange,
  onMarkerKindChange,
  onMarkerColorChange,
}: BoardToolbarProps) {
  return (
    <div className={styles.toolbar} role="toolbar" aria-label="Outils du plateau">
      <div className={styles.group}>
        {TOOLS.map(({ id, label, shortcut, icon: Icon }) => (
          <button
            key={id}
            className={`${styles.toolButton} ${tool === id ? styles.toolButtonActive : ''}`}
            type="button"
            aria-pressed={tool === id}
            aria-label={label}
            title={`${label}${shortcut ? ` (${shortcut})` : ''}`}
            disabled={id === 'place' && !canPlace}
            onClick={() => onToolChange(id)}
          >
            <Icon aria-hidden />
            <span className={styles.toolLabel}>{label}</span>
          </button>
        ))}
      </div>

      {tool === 'arrow' && (
        <div
          className={`${styles.context} ${styles.arrowPalette}`}
          aria-label="Type de flèche"
          role="radiogroup"
        >
          {ARROW_PRESETS.map((preset) => {
            const Icon = preset.icon
            const selected = arrowStyle === preset.style
            return (
              <button
                aria-checked={selected}
                aria-label={preset.label}
                className={`${styles.arrowPreset} ${selected ? styles.arrowPresetActive : ''}`}
                key={preset.style}
                onClick={() => {
                  onArrowStyleChange(preset.style)
                  onArrowColorChange(preset.color)
                }}
                role="radio"
                style={{ '--arrow-preset-color': preset.color } as CSSProperties}
                title={preset.label}
                type="button"
              >
                <Icon aria-hidden />
                <span>{preset.label}</span>
              </button>
            )
          })}
        </div>
      )}

      {tool === 'marker' && (
        <div className={styles.context} aria-label="Options de marqueur">
          <label>
            <span className="sr-only">Type de marqueur</span>
            <select
              className={styles.select}
              value={markerKind}
              onChange={(event) => onMarkerKindChange(event.target.value as MarkerKind)}
            >
              <option value="objective">Objectif</option>
              <option value="warning">Danger</option>
              <option value="rally-point">Regroupement</option>
            </select>
          </label>
          <label>
            <span className="sr-only">Couleur du marqueur</span>
            <input
              className={styles.color}
              type="color"
              value={markerColor}
              onChange={(event) => onMarkerColorChange(event.target.value)}
            />
          </label>
        </div>
      )}
    </div>
  )
}
