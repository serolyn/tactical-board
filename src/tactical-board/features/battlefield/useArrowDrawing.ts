/**
 * @packageDocumentation
 * Interface du plateau tactique.
 *
 * Ce fichier gère la grille, les unités, les flèches et les marqueurs. Si tu
 * veux comprendre ce que voit l'utilisateur quand il manipule le plateau, c'est
 * ici qu'il faut commencer.
 */

import { useRef, useState, type MutableRefObject, type PointerEvent } from 'react'
import type { ArrowStyle, Position } from '@/tactical-board/model/tacticalBoardTypes'
import { samePosition } from './battlefieldGeometry'

interface ArrowPointerState {
  start: Position
  clientX: number
  clientY: number
  moved: boolean
}

export interface UseArrowDrawingOptions {
  arrowColor: string
  arrowStyle: ArrowStyle
  enabled: boolean
  onAddArrow: (
    start: Position,
    end: Position,
    style: ArrowStyle,
    color: string,
  ) => void
  positionFromClientPoint: (clientX: number, clientY: number) => Position | null
  suppressClickRef: MutableRefObject<boolean>
}
/**
 * Cette fonction intervient sur le sujet “use Arrow Drawing” dans tactical-board.
 *
 * Fichier: src/tactical-board/features/battlefield/useArrowDrawing.ts
 * Si tu lis ce fichier pour apprendre, regarde d’abord useArrowDrawing dans useArrowDrawing.ts.
 */


export function useArrowDrawing({
  arrowColor,
  arrowStyle,
  enabled,
  onAddArrow,
  positionFromClientPoint,
  suppressClickRef,
}: UseArrowDrawingOptions) {
  const [arrowStart, setArrowStart] = useState<Position | null>(null)
  const [arrowPreview, setArrowPreview] = useState<Position | null>(null)
  const arrowPointerRef = useRef<ArrowPointerState | null>(null)

  const handleArrowCellClick = (position: Position) => {
    if (!arrowStart) {
      setArrowStart(position)
      setArrowPreview(position)
    } else if (samePosition(arrowStart, position)) {
      setArrowStart(null)
      setArrowPreview(null)
    } else {
      onAddArrow(arrowStart, position, arrowStyle, arrowColor)
      setArrowStart(null)
      setArrowPreview(null)
    }
  }

  const handleCellPointerDown = (
    event: PointerEvent<HTMLButtonElement>,
    position: Position,
  ) => {
    if (!enabled) return
    arrowPointerRef.current = {
      start: position,
      clientX: event.clientX,
      clientY: event.clientY,
      moved: false,
    }
  }

  const handleCellPointerMove = (
    event: PointerEvent<HTMLButtonElement>,
    position: Position,
  ) => {
    if (!enabled) return
    setArrowPreview(position)
    const pointer = arrowPointerRef.current
    if (
      pointer &&
      Math.hypot(event.clientX - pointer.clientX, event.clientY - pointer.clientY) >= 6
    ) {
      pointer.moved = true
      setArrowStart(pointer.start)
    }
  }

  const handleCellPointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    if (!enabled) return
    const pointer = arrowPointerRef.current
    arrowPointerRef.current = null
    if (!pointer?.moved) return
    suppressClickRef.current = true
    const end = positionFromClientPoint(event.clientX, event.clientY)
    if (end && !samePosition(pointer.start, end)) {
      onAddArrow(pointer.start, end, arrowStyle, arrowColor)
    }
    setArrowStart(null)
    setArrowPreview(null)
  }

  return {
    arrowPreview,
    arrowStart,
    handleArrowCellClick,
    handleCellPointerDown,
    handleCellPointerMove,
    handleCellPointerUp,
    setArrowPreview,
  }
}
