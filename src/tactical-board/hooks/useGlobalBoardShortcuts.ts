/**
 * @packageDocumentation
 * Hooks de comportement Tactical Board.
 *
 * Ces fonctions réutilisables branchent la logique au cycle de vie React:
 * autosave, raccourcis clavier, mode plein plateau ou URLs des assets.
 */

import { useEffect, useRef } from 'react'

export interface GlobalBoardShortcutOptions {
  boardOnlyMode: boolean
  onCancel(): void
  onDelete(): void
  onExitBoardOnly(): void
  onForceSave(): void
  onRedo(): void
  onShiftEnd(): void
  onShiftStart(): void
  onUndo(): void
}
/**
 * Cette fonction teste le sujet “editable Target” dans tactical-board.
 *
 * Fichier: src/tactical-board/hooks/useGlobalBoardShortcuts.ts
 * Si tu lis ce fichier pour apprendre, regarde d’abord isEditableTarget dans useGlobalBoardShortcuts.ts.
 */


function isEditableTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  )
}

/** Centralise uniquement les raccourcis globaux du plateau hors champs éditables. */
export function useGlobalBoardShortcuts({
  boardOnlyMode,
  onCancel,
  onDelete,
  onExitBoardOnly,
  onForceSave,
  onRedo,
  onShiftEnd,
  onShiftStart,
  onUndo,
}: GlobalBoardShortcutOptions): void {
  const shiftSelectionRef = useRef(false)

  useEffect(() => {
    const finishShiftSelection = () => {
      if (!shiftSelectionRef.current) return
      shiftSelectionRef.current = false
      onShiftEnd()
    }

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape' && boardOnlyMode) {
        event.preventDefault()
        onExitBoardOnly()
        return
      }
      const modifier = event.ctrlKey || event.metaKey
      if (modifier && event.key.toLowerCase() === 's') {
        event.preventDefault()
        onForceSave()
        return
      }
      if (isEditableTarget(event.target)) return
      if (event.key === 'Shift' && !event.repeat) {
        shiftSelectionRef.current = true
        onShiftStart()
        return
      }
      if (modifier && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        if (event.shiftKey) onRedo()
        else onUndo()
        return
      }
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault()
        onDelete()
        return
      }
      if (event.key === 'Escape') {
        shiftSelectionRef.current = false
        onCancel()
      }
    }
    const handleKeyUp = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Shift') finishShiftSelection()
    }
    const handleWindowBlur = () => finishShiftSelection()

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleWindowBlur)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleWindowBlur)
    }
  }, [
    boardOnlyMode,
    onCancel,
    onDelete,
    onExitBoardOnly,
    onForceSave,
    onRedo,
    onShiftEnd,
    onShiftStart,
    onUndo,
  ])
}
