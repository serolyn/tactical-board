/** Synchronise le mode plateau seul avec l'API plein écran du navigateur. */
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'

export interface BoardOnlyModeOptions {
  onEnter(): void
  shouldExit: boolean
}

export interface BoardOnlyModeState {
  boardOnlyMode: boolean
  appRef: RefObject<HTMLDivElement | null>
  boardOnlyExitRef: RefObject<HTMLButtonElement | null>
  enterBoardOnlyMode(): void
  leaveBoardOnlyMode(): void
}

export function useBoardOnlyMode({
  onEnter,
  shouldExit,
}: BoardOnlyModeOptions): BoardOnlyModeState {
  const [boardOnlyMode, setBoardOnlyMode] = useState(false)
  const appRef = useRef<HTMLDivElement>(null)
  const boardOnlyExitRef = useRef<HTMLButtonElement>(null)
  const boardOnlyModeRef = useRef(false)
  const ownsBrowserFullscreenRef = useRef(false)

  const leaveBoardOnlyMode = useCallback(() => {
    boardOnlyModeRef.current = false
    setBoardOnlyMode(false)
    const ownsCurrentFullscreen = document.fullscreenElement === appRef.current
    ownsBrowserFullscreenRef.current = false
    if (ownsCurrentFullscreen && document.exitFullscreen) {
      void document.exitFullscreen().catch(() => undefined)
    }
  }, [])

  const enterBoardOnlyMode = useCallback(() => {
    onEnter()
    boardOnlyModeRef.current = true
    setBoardOnlyMode(true)

    const target = appRef.current
    if (!target?.requestFullscreen || document.fullscreenElement) return
    void target.requestFullscreen().then(
      () => {
        ownsBrowserFullscreenRef.current = true
        if (
          !boardOnlyModeRef.current &&
          document.fullscreenElement === target &&
          document.exitFullscreen
        ) {
          ownsBrowserFullscreenRef.current = false
          void document.exitFullscreen().catch(() => undefined)
        }
      },
      () => {
        ownsBrowserFullscreenRef.current = false
      },
    )
  }, [onEnter])

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (document.fullscreenElement === appRef.current) {
        ownsBrowserFullscreenRef.current = true
        if (!boardOnlyModeRef.current && document.exitFullscreen) {
          ownsBrowserFullscreenRef.current = false
          void document.exitFullscreen().catch(() => undefined)
        }
        return
      }
      if (!ownsBrowserFullscreenRef.current) return
      ownsBrowserFullscreenRef.current = false
      boardOnlyModeRef.current = false
      setBoardOnlyMode(false)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  useEffect(() => {
    if (!boardOnlyMode) return
    const frame = requestAnimationFrame(() => boardOnlyExitRef.current?.focus())
    return () => cancelAnimationFrame(frame)
  }, [boardOnlyMode])

  useEffect(() => {
    if (boardOnlyMode && shouldExit) leaveBoardOnlyMode()
  }, [boardOnlyMode, leaveBoardOnlyMode, shouldExit])

  return {
    boardOnlyMode,
    appRef,
    boardOnlyExitRef,
    enterBoardOnlyMode,
    leaveBoardOnlyMode,
  }
}
