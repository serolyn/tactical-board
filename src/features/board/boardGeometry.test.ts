import { describe, expect, it } from 'vitest'
import type { BoardAnnotation } from '../../domain'
import {
  cellKey,
  coordinateLabel,
  distanceToSegment,
  getAnnotationAt,
  isPositionInGrid,
  positionFromClientPoint,
  samePosition,
} from './boardGeometry'

const grid = { rows: 8, columns: 10 }
const bounds = {
  bottom: 420,
  height: 400,
  left: 10,
  right: 510,
  top: 20,
  width: 500,
}

describe('géométrie du plateau', () => {
  it('produit les clés et coordonnées attendues', () => {
    expect(cellKey({ row: 2, column: 4 })).toBe('2:4')
    expect(coordinateLabel({ row: 2, column: 4 })).toBe('E3')
    expect(samePosition({ row: 2, column: 4 }, { row: 2, column: 4 })).toBe(true)
    expect(samePosition({ row: 2, column: 4 }, { row: 3, column: 4 })).toBe(false)
  })

  it('borne les positions logiques à la grille', () => {
    expect(isPositionInGrid({ row: 0, column: 0 }, grid)).toBe(true)
    expect(isPositionInGrid({ row: 7, column: 9 }, grid)).toBe(true)
    expect(isPositionInGrid({ row: -1, column: 0 }, grid)).toBe(false)
    expect(isPositionInGrid({ row: 8, column: 0 }, grid)).toBe(false)
    expect(isPositionInGrid({ row: 0, column: 10 }, grid)).toBe(false)
  })

  it('convertit un point client en case et exclut les bords droit et inférieur', () => {
    expect(positionFromClientPoint(bounds, grid, 35, 45)).toEqual({ row: 0, column: 0 })
    expect(positionFromClientPoint(bounds, grid, 485, 395)).toEqual({ row: 7, column: 9 })
    expect(positionFromClientPoint(bounds, grid, 510, 200)).toBeNull()
    expect(positionFromClientPoint(bounds, grid, 200, 420)).toBeNull()
    expect(positionFromClientPoint(bounds, grid, 9, 20)).toBeNull()
    expect(
      positionFromClientPoint({ ...bounds, width: 0, right: bounds.left }, grid, 10, 20),
    ).toBeNull()
  })

  it('mesure la distance au segment, y compris pour un segment nul', () => {
    expect(
      distanceToSegment(
        { row: 1, column: 2 },
        { row: 1, column: 0 },
        { row: 1, column: 4 },
      ),
    ).toBe(0)
    expect(
      distanceToSegment(
        { row: 2, column: 2 },
        { row: 1, column: 0 },
        { row: 1, column: 4 },
      ),
    ).toBe(1)
    expect(
      distanceToSegment(
        { row: 2, column: 2 },
        { row: 1, column: 1 },
        { row: 1, column: 1 },
      ),
    ).toBeCloseTo(Math.SQRT2)
  })

  it('préfère un marqueur puis la flèche la plus proche sous le seuil', () => {
    const annotations: BoardAnnotation[] = [
      {
        id: 'far-arrow',
        kind: 'arrow',
        start: { row: 2, column: 0 },
        end: { row: 2, column: 4 },
        color: '#ef4444',
        style: 'attack',
      },
      {
        id: 'near-arrow',
        kind: 'arrow',
        start: { row: 1, column: 0 },
        end: { row: 1, column: 4 },
        color: '#3b82f6',
        style: 'support',
      },
      {
        id: 'marker',
        kind: 'marker',
        position: { row: 1, column: 2 },
        color: '#eab308',
        markerType: 'objective',
        label: 'Objectif',
      },
    ]

    expect(getAnnotationAt(annotations, { row: 1, column: 2 })?.id).toBe('marker')
    expect(getAnnotationAt(annotations.slice(0, 2), { row: 1, column: 2 })?.id).toBe(
      'near-arrow',
    )
    expect(getAnnotationAt(annotations.slice(0, 2), { row: 7, column: 7 })).toBeUndefined()
  })
})
