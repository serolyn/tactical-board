/** Relie le modèle métier au document actif et aux préférences éphémères de l'éditeur. */
/**
 * @packageDocumentation
 * Store global Tactical Board (Zustand).
 *
 * Ce module centralise les documents, l'historique undo/redo, les outils
 * actifs, la sélection et l'état d'interface consommé par la racine React.
 */
import { create } from 'zustand'
import {
  applyCommandToHistory,
  createHistory,
  redoHistory,
  undoHistory,
  type HistoryState,
} from '@/tactical-board/model/scenarioHistory'
import { createDefaultScenario } from '@/tactical-board/model/scenarioDocument'
import type { BoardSelection } from '@/tactical-board/model/boardSelection'
import type { BoardTool, MarkerKind } from '@/tactical-board/model/boardInteraction'
import type {
  ArrowStyle,
  ScenarioCommand,
  ScenarioDocumentV1,
} from '@/tactical-board/model/tacticalBoardTypes'

export interface TacticalBoardNotification {
  id: number
  message: string
  tone: 'info' | 'success' | 'error'
}

export interface TacticalBoardStoreState {
  documents: readonly ScenarioDocumentV1[]
  history: HistoryState<ScenarioDocumentV1> | null
  hydrated: boolean
  tool: BoardTool
  selectedTypeId: string | null
  activeFactionId: string | null
  selection: BoardSelection
  zoom: number
  arrowStyle: ArrowStyle
  arrowColor: string
  markerKind: MarkerKind
  markerColor: string
  leftPanelOpen: boolean
  rightPanelOpen: boolean
  notification: TacticalBoardNotification | null
  hydrate: (documents: readonly ScenarioDocumentV1[], activeScenarioId?: string) => ScenarioDocumentV1
  commit: (command: ScenarioCommand) => ScenarioDocumentV1 | null
  undo: () => ScenarioDocumentV1 | null
  redo: () => ScenarioDocumentV1 | null
  setActiveScenario: (id: string) => ScenarioDocumentV1 | null
  addDocument: (document: ScenarioDocumentV1) => void
  removeDocument: (id: string, fallback?: ScenarioDocumentV1) => ScenarioDocumentV1 | null
  replaceDocument: (document: ScenarioDocumentV1) => void
  setTool: (tool: BoardTool) => void
  setSelectedTypeId: (id: string | null) => void
  setActiveFactionId: (id: string | null) => void
  setSelection: (selection: BoardSelection) => void
  setZoom: (zoom: number) => void
  setArrowStyle: (style: ArrowStyle) => void
  setArrowColor: (color: string) => void
  setMarkerKind: (kind: MarkerKind) => void
  setMarkerColor: (color: string) => void
  setLeftPanelOpen: (open: boolean) => void
  setRightPanelOpen: (open: boolean) => void
  notify: (message: string, tone?: TacticalBoardNotification['tone']) => void
  clearNotification: () => void
}
/**
 * Cette fonction intervient sur le sujet “update Document List” dans tactical-board.
 *
 * Fichier: src/tactical-board/state/tacticalBoardStore.ts
 * Si tu lis ce fichier pour apprendre, regarde d’abord updateDocumentList dans tacticalBoardStore.ts.
 */


function updateDocumentList(
  documents: readonly ScenarioDocumentV1[],
  document: ScenarioDocumentV1,
) {
  const index = documents.findIndex((candidate) => candidate.id === document.id)
  if (index < 0) return [document, ...documents]
  return [
    ...documents.slice(0, index),
    document,
    ...documents.slice(index + 1),
  ]
}
/**
 * Cette fonction extrait le sujet “ion Still Exists” dans tactical-board.
 *
 * Fichier: src/tactical-board/state/tacticalBoardStore.ts
 * Si tu lis ce fichier pour apprendre, regarde d’abord selectionStillExists dans tacticalBoardStore.ts.
 */


function selectionStillExists(
  selection: BoardSelection,
  document: ScenarioDocumentV1,
): BoardSelection {
  if (!selection) return null
  if (selection.kind === 'unit') {
    return document.units.some((unit) => unit.id === selection.id) ? selection : null
  }
  if (selection.kind === 'units') {
    const availableIds = new Set(document.units.map((unit) => unit.id))
    const ids = [...new Set(selection.ids)].filter((id) => availableIds.has(id))
    if (!ids.length) return null
    if (ids.length === 1) return { kind: 'unit', id: ids[0]! }
    return { kind: 'units', ids }
  }
  return document.annotations.some((annotation) => annotation.id === selection.id) ? selection : null
}

let notificationSequence = 0

// Le store orchestre le document actif et l'état éphémère sans dépendre de l'interface React.
export const useTacticalBoardStore = create<TacticalBoardStoreState>((set, get) => ({
  documents: [],
  history: null,
  hydrated: false,
  tool: 'select',
  selectedTypeId: null,
  activeFactionId: null,
  selection: null,
  zoom: 1,
  arrowStyle: 'attack',
  arrowColor: '#ef4444',
  markerKind: 'objective',
  markerColor: '#f6ba5b',
  leftPanelOpen: false,
  rightPanelOpen: false,
  notification: null,

  hydrate(documents, activeScenarioId) {
    const initialDocuments = documents.length ? [...documents] : [createDefaultScenario()]
    const active =
      initialDocuments.find((document) => document.id === activeScenarioId) ?? initialDocuments[0]!
    set({
      documents: initialDocuments,
      history: createHistory(active),
      hydrated: true,
      activeFactionId: active.factions[0]?.id ?? null,
      selection: null,
      selectedTypeId: null,
      tool: 'select',
      rightPanelOpen: false,
    })
    return active
  },

  commit(command) {
    const history = get().history
    if (!history) return null
    const stamped = { ...command, at: command.at ?? new Date().toISOString() } as ScenarioCommand
    const result = applyCommandToHistory(history, stamped)
    if (!result.commandResult.changed) return history.present
    const document = result.history.present
    set((state) => {
      const selection = selectionStillExists(state.selection, document)
      return {
        history: result.history,
        documents: updateDocumentList(state.documents, document),
        selection,
        rightPanelOpen: selection ? state.rightPanelOpen : false,
      }
    })
    return document
  },

  undo() {
    const history = get().history
    if (!history) return null
    const next = undoHistory(history)
    if (next === history) return history.present
    set((state) => {
      const selection = selectionStillExists(state.selection, next.present)
      return {
        history: next,
        documents: updateDocumentList(state.documents, next.present),
        selection,
        rightPanelOpen: selection ? state.rightPanelOpen : false,
      }
    })
    return next.present
  },

  redo() {
    const history = get().history
    if (!history) return null
    const next = redoHistory(history)
    if (next === history) return history.present
    set((state) => {
      const selection = selectionStillExists(state.selection, next.present)
      return {
        history: next,
        documents: updateDocumentList(state.documents, next.present),
        selection,
        rightPanelOpen: selection ? state.rightPanelOpen : false,
      }
    })
    return next.present
  },

  setActiveScenario(id) {
    const document = get().documents.find((candidate) => candidate.id === id)
    if (!document) return null
    set({
      history: createHistory(document),
      activeFactionId: document.factions[0]?.id ?? null,
      selection: null,
      selectedTypeId: null,
      tool: 'select',
      rightPanelOpen: false,
    })
    return document
  },

  addDocument(document) {
    set((state) => ({
      documents: [document, ...state.documents.filter((candidate) => candidate.id !== document.id)],
      history: createHistory(document),
      activeFactionId: document.factions[0]?.id ?? null,
      selection: null,
      selectedTypeId: null,
      tool: 'select',
      rightPanelOpen: false,
    }))
  },

  removeDocument(id, fallback) {
    const remaining = get().documents.filter((document) => document.id !== id)
    if (!remaining.length && fallback) remaining.push(fallback)
    const active = remaining[0] ?? null
    set({
      documents: remaining,
      history: active ? createHistory(active) : null,
      activeFactionId: active?.factions[0]?.id ?? null,
      selection: null,
      selectedTypeId: null,
      tool: 'select',
      rightPanelOpen: false,
    })
    return active
  },

  replaceDocument(document) {
    set((state) => ({
      documents: updateDocumentList(state.documents, document),
      history:
        state.history?.present.id === document.id ? createHistory(document) : state.history,
    }))
  },

  setTool(tool) {
    const selection = tool === 'select' ? get().selection : null
    set({
      tool,
      selection,
      rightPanelOpen: selection ? get().rightPanelOpen : false,
    })
  },
  setSelectedTypeId(id) {
    set({ selectedTypeId: id, tool: id ? 'place' : get().tool })
  },
  setActiveFactionId(id) {
    set({ activeFactionId: id })
  },
  setSelection(selection) {
    const inspectable = selection?.kind === 'unit' || selection?.kind === 'annotation'
    set({
      selection,
      rightPanelOpen: inspectable,
      leftPanelOpen:
        selection && selection.kind !== 'units' ? false : get().leftPanelOpen,
    })
  },
  setZoom(zoom) {
    set({ zoom: Math.max(0.4, Math.min(2, zoom)) })
  },
  setArrowStyle(arrowStyle) {
    set({ arrowStyle })
  },
  setArrowColor(arrowColor) {
    set({ arrowColor })
  },
  setMarkerKind(markerKind) {
    set({ markerKind })
  },
  setMarkerColor(markerColor) {
    set({ markerColor })
  },
  setLeftPanelOpen(leftPanelOpen) {
    set({ leftPanelOpen, rightPanelOpen: leftPanelOpen ? false : get().rightPanelOpen })
  },
  setRightPanelOpen(rightPanelOpen) {
    set({ rightPanelOpen, leftPanelOpen: rightPanelOpen ? false : get().leftPanelOpen })
  },
  notify(message, tone = 'info') {
    notificationSequence += 1
    set({ notification: { id: notificationSequence, message, tone } })
  },
  clearNotification() {
    set({ notification: null })
  },
}))
/**
 * Cette fonction extrait le sujet “active Scenario” dans tactical-board.
 *
 * Fichier: src/tactical-board/state/tacticalBoardStore.ts
 * Si tu lis ce fichier pour apprendre, regarde d’abord selectActiveScenario dans tacticalBoardStore.ts.
 */


export const selectActiveScenario = (state: TacticalBoardStoreState) =>
  state.history?.present ?? null
