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
  BoardAnnotation,
  GridConfig,
  Position,
} from '@/tactical-board/model/tacticalBoardTypes'

/** Rectangle DOM minimal requis pour convertir un pointeur en case métier. */
export interface BattlefieldBounds {
  readonly bottom: number
  readonly height: number
  readonly left: number
  readonly right: number
  readonly top: number
  readonly width: number
}
/**
 * Cette fonction intervient sur le sujet “same Position” dans tactical-board.
 *
 * Fichier: src/tactical-board/features/battlefield/battlefieldGeometry.ts
 * Si tu lis ce fichier pour apprendre, regarde d’abord samePosition dans battlefieldGeometry.ts.
 */


export function samePosition(left: Position, right: Position): boolean {
  return left.row === right.row && left.column === right.column
}
/**
 * Cette fonction intervient sur le sujet “cell Key” dans tactical-board.
 *
 * Fichier: src/tactical-board/features/battlefield/battlefieldGeometry.ts
 * Si tu lis ce fichier pour apprendre, regarde d’abord cellKey dans battlefieldGeometry.ts.
 */


export function cellKey(position: Position): string {
  return `${position.row}:${position.column}`
}
/**
 * Cette fonction intervient sur le sujet “coordinate Label” dans tactical-board.
 *
 * Fichier: src/tactical-board/features/battlefield/battlefieldGeometry.ts
 * Si tu lis ce fichier pour apprendre, regarde d’abord coordinateLabel dans battlefieldGeometry.ts.
 */


export function coordinateLabel(position: Position): string {
  return `${String.fromCharCode(65 + position.column)}${position.row + 1}`
}
/**
 * Cette fonction teste le sujet “position In Grid” dans tactical-board.
 *
 * Fichier: src/tactical-board/features/battlefield/battlefieldGeometry.ts
 * Si tu lis ce fichier pour apprendre, regarde d’abord isPositionInGrid dans battlefieldGeometry.ts.
 */


export function isPositionInGrid(
  position: Position,
  grid: Pick<GridConfig, 'rows' | 'columns'>,
): boolean {
  return (
    position.row >= 0 &&
    position.column >= 0 &&
    position.row < grid.rows &&
    position.column < grid.columns
  )
}

/** Convertit des coordonnées client en indices de grille, sans dépendre du DOM réel. */
export function positionFromClientPoint(
  bounds: BattlefieldBounds,
  grid: Pick<GridConfig, 'rows' | 'columns'>,
  clientX: number,
  clientY: number,
): Position | null {
  if (
    bounds.width <= 0 ||
    bounds.height <= 0 ||
    clientX < bounds.left ||
    clientX >= bounds.right ||
    clientY < bounds.top ||
    clientY >= bounds.bottom
  ) return null

  const column = Math.floor(((clientX - bounds.left) / bounds.width) * grid.columns)
  const row = Math.floor(((clientY - bounds.top) / bounds.height) * grid.rows)
  const position = { row, column }
  return Number.isInteger(row) && Number.isInteger(column) && isPositionInGrid(position, grid)
    ? position
    : null
}

/** Mesure en cases la proximité d’un point avec un segment de flèche. */
export function distanceToSegment(
  point: Position,
  start: Position,
  end: Position,
): number {
  const px = point.column + 0.5
  const py = point.row + 0.5
  const x1 = start.column + 0.5
  const y1 = start.row + 0.5
  const x2 = end.column + 0.5
  const y2 = end.row + 0.5
  const dx = x2 - x1
  const dy = y2 - y1
  const lengthSquared = dx * dx + dy * dy
  if (!lengthSquared) return Math.hypot(px - x1, py - y1)
  const factor = Math.max(
    0,
    Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSquared),
  )
  return Math.hypot(px - (x1 + factor * dx), py - (y1 + factor * dy))
}

/** Retrouve d’abord un marqueur exact, puis la flèche la plus proche du pointeur. */
export function getAnnotationAt(
  annotations: readonly BoardAnnotation[],
  position: Position,
): BoardAnnotation | undefined {
  const marker = annotations.find(
    (annotation) =>
      annotation.kind === 'marker' && samePosition(annotation.position, position),
  )
  if (marker) return marker
  return annotations
    .filter((annotation): annotation is ArrowAnnotation => annotation.kind === 'arrow')
    .map((annotation) => ({
      annotation,
      distance: distanceToSegment(position, annotation.start, annotation.end),
    }))
    .filter(({ distance }) => distance <= 0.42)
    .sort((left, right) => left.distance - right.distance)[0]?.annotation
}
