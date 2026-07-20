/**
 * @packageDocumentation
 * Interface du plateau tactique.
 *
 * Ce fichier gère la grille, les unités, les flèches et les marqueurs. Si tu
 * veux comprendre ce que voit l'utilisateur quand il manipule le plateau, c'est
 * ici qu'il faut commencer.
 */

import type {
  ArrowAnnotation,
  ArrowStyle,
  Position,
} from '@/tactical-board/model/tacticalBoardTypes'
import { samePosition } from './battlefieldGeometry'
import styles from './Battlefield.module.css'

export interface ArrowLayerProps {
  annotations: readonly ArrowAnnotation[]
  arrowColor: string
  arrowStyle: ArrowStyle
  columns: number
  previewEnd: Position | null
  previewStart: Position | null
  rows: number
  selectedAnnotationId: string | null
}
/**
 * Cette fonction intervient sur le sujet “arrow Layer” dans tactical-board.
 *
 * Fichier: src/tactical-board/features/battlefield/ArrowLayer.tsx
 * Si tu lis ce fichier pour apprendre, regarde d’abord ArrowLayer dans ArrowLayer.tsx.
 */


export function ArrowLayer({
  annotations,
  arrowColor,
  arrowStyle,
  columns,
  previewEnd,
  previewStart,
  rows,
  selectedAnnotationId,
}: ArrowLayerProps) {
  return (
    <svg
      className={styles.annotationLayer}
      viewBox={`0 0 ${columns} ${rows}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        {annotations.map((annotation) => (
          <marker
            key={annotation.id}
            id={`arrow-${annotation.id}`}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="4"
            markerHeight="4"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={annotation.color} />
          </marker>
        ))}
        <marker
          id="preview-arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="4"
          markerHeight="4"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={arrowColor} />
        </marker>
      </defs>
      {annotations.map((annotation) => (
        <line
          key={annotation.id}
          className={styles.arrow}
          data-png-opacity="0.84"
          data-png-stroke-width="3.5"
          x1={annotation.start.column + 0.5}
          y1={annotation.start.row + 0.5}
          x2={annotation.end.column + 0.5}
          y2={annotation.end.row + 0.5}
          stroke={annotation.color}
          strokeWidth={selectedAnnotationId === annotation.id ? 5 : 3.5}
          strokeDasharray={
            annotation.style === 'attack'
              ? '9 6'
              : annotation.style === 'support'
                ? '3 6'
                : undefined
          }
          markerEnd={`url(#arrow-${annotation.id})`}
          opacity={selectedAnnotationId === annotation.id ? 1 : 0.84}
        />
      ))}
      {previewStart && previewEnd && !samePosition(previewStart, previewEnd) ? (
        <line
          className={`${styles.arrow} ${styles.previewLine}`}
          data-png-hide="true"
          x1={previewStart.column + 0.5}
          y1={previewStart.row + 0.5}
          x2={previewEnd.column + 0.5}
          y2={previewEnd.row + 0.5}
          stroke={arrowColor}
          strokeWidth={3.5}
          strokeDasharray={
            arrowStyle === 'attack' ? '9 6' : arrowStyle === 'support' ? '3 6' : undefined
          }
          markerEnd="url(#preview-arrow)"
        />
      ) : null}
    </svg>
  )
}
