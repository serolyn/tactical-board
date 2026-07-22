import { Flag, MapPin, TriangleAlert } from 'lucide-react'
import type { CSSProperties } from 'react'
import type { MarkerAnnotation } from '@/tactical-board/model/tacticalBoardTypes'
import styles from './Battlefield.module.css'

function markerIcon(markerType: MarkerAnnotation['markerType']) {
  if (markerType === 'danger') return TriangleAlert
  if (markerType === 'rally') return MapPin
  return Flag
}

export interface MarkerLayerProps {
  annotations: readonly MarkerAnnotation[]
  selectedAnnotationId: string | null
}

export function MarkerLayer({ annotations, selectedAnnotationId }: MarkerLayerProps) {
  return annotations.map((annotation) => {
    const MarkerIcon = markerIcon(annotation.markerType)
    return (
      <span
        key={annotation.id}
        aria-label={`${annotation.label || 'Marqueur'}, ${annotation.markerType}`}
        className={`${styles.marker} ${selectedAnnotationId === annotation.id ? styles.markerSelected : ''}`}
        data-png-remove-class={
          selectedAnnotationId === annotation.id ? styles.markerSelected : undefined
        }
        style={{
          left: `calc(${annotation.position.column} * var(--cell-size))`,
          top: `calc(${annotation.position.row} * var(--cell-size))`,
          '--marker-color': annotation.color,
        } as CSSProperties}
        title={annotation.label || annotation.markerType}
        role="img"
      >
        <MarkerIcon aria-hidden />
        <span className={styles.markerLabel}>{annotation.label}</span>
      </span>
    )
  })
}
