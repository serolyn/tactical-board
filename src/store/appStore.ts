import { create } from 'zustand'
import {
  applyCommandToHistory,
  createDefaultScenario,
  createHistory,
  redoHistory,
  undoHistory,
  type HistoryState,
  type ScenarioCommand,
  type ScenarioDocumentV1,
} from '../domain'
import type { BoardSelection } from '../features/board/Board'
import type { ArrowStyle, BoardTool, MarkerKind } from '../features/board/BoardToolbar'

export interface AppNotification {
  id: number
  message: string
  tone: 'info' | 'success' | 'error'
}

export interface AppStoreState {
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
  notification: AppNotification | null
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
  notify: (message: string, tone?: AppNotification['tone']) => void
  clearNotification: () => void
}

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

function selectionStillExists(
  selection: BoardSelection,
  document: ScenarioDocumentV1,
): BoardSelection {
  if (!selection) return null
  if (selection.kind === 'unit') {
    return document.units.some((unit) => unit.id === selection.id) ? selection : null
  }
  return document.annotations.some((annotation) => annotation.id === selection.id) ? selection : null
}

let notificationSequence = 0

export const useAppStore = create<AppStoreState>((set, get) => ({
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
    set({
      selection,
      rightPanelOpen: Boolean(selection),
      leftPanelOpen: selection ? false : get().leftPanelOpen,
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

export const selectActiveScenario = (state: AppStoreState) => state.history?.present ?? null
