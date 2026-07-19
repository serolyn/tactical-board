import { useRef, useState, type MutableRefObject, type PointerEvent } from 'react'
import type { Position } from '../../domain'
import type { ArrowStyle } from './BoardToolbar'
import { samePosition } from './boardGeometry'

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
