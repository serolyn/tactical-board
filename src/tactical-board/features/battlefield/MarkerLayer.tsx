/**
 * @packageDocumentation
 * Interface du plateau tactique.
 *
 * Ce fichier gère la grille, les unités, les flèches et les marqueurs. Si tu
 * veux comprendre ce que voit l'utilisateur quand il manipule le plateau, c'est
 * ici qu'il faut commencer.
 */

import { Flag, MapPin, TriangleAlert } from 'lucide-react'
import type { CSSProperties } from 'react'
import type { MarkerAnnotation } from '@/tactical-board/model/tacticalBoardTypes'
import styles from './Battlefield.module.css'
/**
 * Cette fonction intervient sur le sujet “marker Icon” dans tactical-board.
 *
 * Fichier: src/tactical-board/features/battlefield/MarkerLayer.tsx
 * Si tu lis ce fichier pour apprendre, regarde d’abord markerIcon dans MarkerLayer.tsx.
 */


function markerIcon(markerType: MarkerAnnotation['markerType']) {
  if (markerType === 'danger') return TriangleAlert
  if (markerType === 'rally') return MapPin
  return Flag
}

export interface MarkerLayerProps {
  annotations: readonly MarkerAnnotation[]
  selectedAnnotationId: string | null
}
/**
 * Cette fonction intervient sur le sujet “marker Layer” dans tactical-board.
 *
 * Fichier: src/tactical-board/features/battlefield/MarkerLayer.tsx
 * Si tu lis ce fichier pour apprendre, regarde d’abord MarkerLayer dans MarkerLayer.tsx.
 */


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
