import {
  CalendarDays,
  Crosshair,
  Focus,
  Grid3X3,
  Maximize2,
  Minimize2,
  Minus,
  PanelLeft,
  PanelRight,
  Plus,
  Settings2,
  Shield,
  Undo2,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './TacticalBoardApp.css'
import { loadAppInitialData } from './app/bootstrap/loadAppInitialData'
import { useAssetUrls } from './app/persistence/useAssetUrls'
import { useScenarioAutosave } from './app/persistence/useScenarioAutosave'
import { deriveSelectionModel } from './app/selectionModel'
import { sortScenarios, uniqueScenarioName } from './app/scenarioUtils'
import { useGlobalShortcuts } from './app/shortcuts/useGlobalShortcuts'
import { useBoardOnlyMode } from './app/useBoardOnlyMode'
import { Button, type SaveState as UiSaveState } from './components'
import {
  BUILT_IN_UNIT_TYPES,
  createDefaultScenario,
  createEntityId,
  previewResize,
  type AnnotationChanges,
  type CustomUnitType,
  type Faction,
  type MarkerAnnotation,
  type Position,
  type ScenarioDocumentV1,
  type UnitEditableChanges,
  type UnitStatus,
  type UnitType,
} from './domain'
import { createNextScenario } from './data'
import {
  InspectorPanel,
  LibraryPanel,
  NewScenarioModal,
  TopBar,
  type CustomTypeDraft,
  type FactionDraft,
  type NewScenarioMetadata,
} from './features'
import { Board } from './features/board/Board'
import { BoardSettingsModal } from './features/board/BoardSettingsModal'
import { BoardToolbar } from './features/board/BoardToolbar'
import {
  NextScenarioModal,
  ObjectiveReachedModal,
  ProgressDateModal,
  ScenarioDetailsModal,
} from './features/scenarios/ScenarioFlowModals'
import {
  createImageAsset,
  exportAllScenariosJson,
  exportBoardToPng,
  exportScenarioJson,
  importScenario,
  tacticalBoardRepository,
} from './services'
import { selectActiveScenario, useAppStore } from './store/appStore'
import styles from './App.module.css'

function saveStateFor(snapshot: ReturnType<typeof useScenarioAutosave>['saveSnapshot']): UiSaveState {
  if (snapshot.state === 'error') return 'error'
  if (snapshot.state === 'saving' || snapshot.state === 'pending') return 'saving'
  return 'saved'
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return 'Une erreur inattendue est survenue.'
}

function formatScenarioDate(value: string) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T12:00:00`)
    : new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function useDesktopLayout() {
  const query = '(min-width: 1180px)'
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' && 'matchMedia' in window
      ? window.matchMedia(query).matches
      : true,
  )
  useEffect(() => {
    if (!('matchMedia' in window)) return
    const media = window.matchMedia(query)
    const update = () => setMatches(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  return matches
}

export default function App() {
  const desktopLayout = useDesktopLayout()
  const activeScenario = useAppStore(selectActiveScenario)
  const documents = useAppStore((state) => state.documents)
  const history = useAppStore((state) => state.history)
  const hydrated = useAppStore((state) => state.hydrated)
  const tool = useAppStore((state) => state.tool)
  const selectedTypeId = useAppStore((state) => state.selectedTypeId)
  const activeFactionId = useAppStore((state) => state.activeFactionId)
  const selection = useAppStore((state) => state.selection)
  const zoom = useAppStore((state) => state.zoom)
  const arrowStyle = useAppStore((state) => state.arrowStyle)
  const arrowColor = useAppStore((state) => state.arrowColor)
  const markerKind = useAppStore((state) => state.markerKind)
  const markerColor = useAppStore((state) => state.markerColor)
  const leftPanelOpen = useAppStore((state) => state.leftPanelOpen)
  const rightPanelOpen = useAppStore((state) => state.rightPanelOpen)
  const notification = useAppStore((state) => state.notification)

  const hydrate = useAppStore((state) => state.hydrate)
  const commit = useAppStore((state) => state.commit)
  const undo = useAppStore((state) => state.undo)
  const redo = useAppStore((state) => state.redo)
  const setActiveScenario = useAppStore((state) => state.setActiveScenario)
  const addDocument = useAppStore((state) => state.addDocument)
  const removeDocument = useAppStore((state) => state.removeDocument)
  const setTool = useAppStore((state) => state.setTool)
  const setSelectedTypeId = useAppStore((state) => state.setSelectedTypeId)
  const setActiveFactionId = useAppStore((state) => state.setActiveFactionId)
  const setSelection = useAppStore((state) => state.setSelection)
  const setZoom = useAppStore((state) => state.setZoom)
  const setArrowStyle = useAppStore((state) => state.setArrowStyle)
  const setArrowColor = useAppStore((state) => state.setArrowColor)
  const setMarkerKind = useAppStore((state) => state.setMarkerKind)
  const setMarkerColor = useAppStore((state) => state.setMarkerColor)
  const setLeftPanelOpen = useAppStore((state) => state.setLeftPanelOpen)
  const setRightPanelOpen = useAppStore((state) => state.setRightPanelOpen)
  const notify = useAppStore((state) => state.notify)
  const clearNotification = useAppStore((state) => state.clearNotification)

  const [initialError, setInitialError] = useState<string | null>(null)
  const [newScenarioOpen, setNewScenarioOpen] = useState(false)
  const [nextScenarioSourceId, setNextScenarioSourceId] = useState<string | null>(null)
  const [objectiveReachedOpen, setObjectiveReachedOpen] = useState(false)
  const [progressOpen, setProgressOpen] = useState(false)
  const [scenarioDetailsOpen, setScenarioDetailsOpen] = useState(false)
  const [boardSettingsOpen, setBoardSettingsOpen] = useState(false)
  const [multiSelectionOpen, setMultiSelectionOpen] = useState(false)
  const boardRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const lastFittedScenarioId = useRef<string | null>(null)
  const { assetUrls, loadAssets, refreshAssetUrls } = useAssetUrls()
  const {
    saveSnapshot,
    flushAutosaveOrThrow,
    forceSave: persistActiveScenario,
    retry: retryAutosave,
  } = useScenarioAutosave(activeScenario, hydrated)

  const prepareBoardOnlyMode = useCallback(() => {
    setLeftPanelOpen(false)
    setRightPanelOpen(false)
    setMultiSelectionOpen(false)
    setTool('select')
  }, [setLeftPanelOpen, setRightPanelOpen, setTool])

  const interfaceRequired =
    multiSelectionOpen ||
    newScenarioOpen ||
    Boolean(nextScenarioSourceId) ||
    objectiveReachedOpen ||
    progressOpen ||
    scenarioDetailsOpen ||
    boardSettingsOpen ||
    saveSnapshot.state === 'error'
  const {
    boardOnlyMode,
    appRef,
    boardOnlyExitRef,
    enterBoardOnlyMode,
    leaveBoardOnlyMode,
  } = useBoardOnlyMode({
    onEnter: prepareBoardOnlyMode,
    shouldExit: interfaceRequired,
  })

  useEffect(() => {
    let cancelled = false
    void loadAppInitialData()
      .then(async ({ activeScenarioId, assets, documents: storedDocuments }) => {
        if (cancelled) return
        const initial = hydrate(storedDocuments, activeScenarioId)
        loadAssets(assets)
        await tacticalBoardRepository.setSetting('activeScenarioId', initial.id)
      })
      .catch((error: unknown) => {
        if (!cancelled) setInitialError(errorMessage(error))
      })
    return () => {
      cancelled = true
    }
  }, [hydrate, loadAssets])

  useEffect(() => {
    if (!notification) return
    const timer = window.setTimeout(clearNotification, 3600)
    return () => window.clearTimeout(timer)
  }, [clearNotification, notification])


  const unitTypes = useMemo<readonly UnitType[]>(
    () => [...BUILT_IN_UNIT_TYPES, ...(activeScenario?.customUnitTypes ?? [])],
    [activeScenario?.customUnitTypes],
  )
  const placementType =
    unitTypes.find((unitType) => unitType.id === selectedTypeId && !unitType.archived) ?? null
  const placementFaction =
    activeScenario?.factions.find((faction) => faction.id === activeFactionId) ??
    activeScenario?.factions[0] ??
    null
  const {
    selectedUnit,
    selectedUnits,
    selectedAnnotation,
    ownFaction,
    canRallySelectedUnits,
    canNeutralizeSelectedUnits,
  } = useMemo(
    () => deriveSelectionModel(activeScenario, selection),
    [activeScenario, selection],
  )
  const orderedDocuments = useMemo(() => sortScenarios(documents), [documents])
  const nextScenarioSource =
    documents.find((document) => document.id === nextScenarioSourceId) ?? activeScenario

  const safelyCommit = useCallback(
    (command: Parameters<typeof commit>[0]) => {
      try {
        return commit(command)
      } catch (error) {
        notify(errorMessage(error), 'error')
        return null
      }
    },
    [commit, notify],
  )

  const forceSave = useCallback(async () => {
    await persistActiveScenario()
    notify('Scénario enregistré sur cet appareil.', 'success')
  }, [notify, persistActiveScenario])

  const deleteSelection = useCallback(() => {
    if (!selection) return
    if (selection.kind === 'unit') {
      safelyCommit({ type: 'removeUnit', unitId: selection.id })
    } else if (selection.kind === 'units') {
      safelyCommit({ type: 'removeUnits', unitIds: selection.ids })
    } else {
      safelyCommit({ type: 'removeAnnotation', annotationId: selection.id })
    }
    setMultiSelectionOpen(false)
    setSelection(null)
  }, [safelyCommit, selection, setSelection])

  const finishMultiSelection = useCallback(() => {
    const currentSelection = useAppStore.getState().selection
    if (currentSelection?.kind !== 'units') {
      setMultiSelectionOpen(false)
      return
    }
    const ids = [...new Set(currentSelection.ids)]
    if (ids.length < 2) {
      setMultiSelectionOpen(false)
      setSelection(ids[0] ? { kind: 'unit', id: ids[0] } : null)
      return
    }
    leaveBoardOnlyMode()
    setMultiSelectionOpen(true)
    setRightPanelOpen(true)
    notify(`${ids.length} unités sélectionnées.`)
  }, [leaveBoardOnlyMode, notify, setRightPanelOpen, setSelection])

  const cancelGlobalInteraction = useCallback(() => {
    setMultiSelectionOpen(false)
    setSelection(null)
    setTool('select')
    setLeftPanelOpen(false)
    setRightPanelOpen(false)
  }, [setLeftPanelOpen, setRightPanelOpen, setSelection, setTool])

  const requestForceSave = useCallback(() => {
    void forceSave().catch((error: unknown) => notify(errorMessage(error), 'error'))
  }, [forceSave, notify])

  const startMultiSelection = useCallback(() => {
    setMultiSelectionOpen(false)
  }, [])

  useGlobalShortcuts({
    boardOnlyMode,
    onCancel: cancelGlobalInteraction,
    onDelete: deleteSelection,
    onExitBoardOnly: leaveBoardOnlyMode,
    onForceSave: requestForceSave,
    onRedo: redo,
    onShiftEnd: finishMultiSelection,
    onShiftStart: startMultiSelection,
    onUndo: undo,
  })

  useEffect(() => {
    if (selection?.kind !== 'units') setMultiSelectionOpen(false)
  }, [selection])

  const createScenario = async (
    name: string,
    rows: number,
    columns: number,
    metadata?: NewScenarioMetadata,
  ) => {
    try {
      const period = metadata?.period
        ? {
            ...(metadata.period.start ? { start: metadata.period.start } : {}),
            ...(metadata.period.target ? { target: metadata.period.target } : {}),
            ...(metadata.period.start ? { current: metadata.period.start } : {}),
          }
        : undefined
      const base = createDefaultScenario(uniqueScenarioName(name, documents), {
        objective: metadata?.objective ?? '',
        ...(period ? { period } : {}),
      })
      const document: ScenarioDocumentV1 = { ...base, grid: { ...base.grid, rows, columns } }
      await flushAutosaveOrThrow()
      await tacticalBoardRepository.saveScenario(document)
      addDocument(document)
      await tacticalBoardRepository.setSetting('activeScenarioId', document.id)
      setNewScenarioOpen(false)
      notify('Nouveau scénario créé.', 'success')
    } catch (error) {
      notify(errorMessage(error), 'error')
    }
  }

  const duplicateScenario = async (id: string) => {
    try {
      const source = documents.find((document) => document.id === id)
      if (!source) return
      const now = new Date().toISOString()
      const duplicate: ScenarioDocumentV1 = {
        ...structuredClone(source),
        id: createEntityId('scenario'),
        name: uniqueScenarioName(source.name, documents),
        createdAt: now,
        updatedAt: now,
      }
      await flushAutosaveOrThrow()
      await tacticalBoardRepository.saveScenario(duplicate)
      addDocument(duplicate)
      await tacticalBoardRepository.setSetting('activeScenarioId', duplicate.id)
      notify('Scénario dupliqué.', 'success')
    } catch (error) {
      notify(errorMessage(error), 'error')
    }
  }

  const deleteScenario = async (id: string) => {
    try {
      await flushAutosaveOrThrow()
      await tacticalBoardRepository.deleteScenario(id)
      const remaining = documents.filter((document) => document.id !== id)
      let fallback: ScenarioDocumentV1 | undefined
      if (!remaining.length) {
        const empty = createDefaultScenario()
        fallback = { ...empty, grid: { ...empty.grid, rows: 20, columns: 20 } }
        await tacticalBoardRepository.saveScenario(fallback)
      }
      const next = removeDocument(id, fallback)
      if (next) await tacticalBoardRepository.setSetting('activeScenarioId', next.id)
      notify('Scénario supprimé.', 'success')
    } catch (error) {
      notify(errorMessage(error), 'error')
    }
  }

  const switchScenario = async (id: string) => {
    try {
      await flushAutosaveOrThrow()
      const next = setActiveScenario(id)
      if (next) await tacticalBoardRepository.setSetting('activeScenarioId', id)
    } catch (error) {
      notify(errorMessage(error), 'error')
    }
  }

  const renameScenario = (id: string, name: string) => {
    if (activeScenario?.id === id) safelyCommit({ type: 'renameScenario', name })
  }

  const setScenarioStatus = (id: string, status: 'active' | 'archived') => {
    if (activeScenario?.id !== id) return
    const changed = safelyCommit({ type: 'setScenarioStatus', status })
    if (changed) notify(status === 'archived' ? 'Scénario archivé.' : 'Scénario réactivé.', 'success')
  }

  const createFollowingScenario = async (copyOwnForces: boolean) => {
    const source = documents.find((document) => document.id === nextScenarioSourceId)
    if (!source) {
      setNextScenarioSourceId(null)
      return
    }
    try {
      const next = createNextScenario(source, {
        copyOwnForces,
        name: uniqueScenarioName(`${source.name} — suite`, documents, 'suite'),
      })
      await flushAutosaveOrThrow()
      await tacticalBoardRepository.saveScenario(next)
      addDocument(next)
      await tacticalBoardRepository.setSetting('activeScenarioId', next.id)
      setNextScenarioSourceId(null)
      notify(
        copyOwnForces
          ? 'Scénario suivant créé avec vos forces.'
          : 'Scénario suivant créé avec un plateau vide.',
        'success',
      )
    } catch (error) {
      notify(errorMessage(error), 'error')
    }
  }

  const handleImport = async (file: File) => {
    try {
      await flushAutosaveOrThrow()
      const imported = await importScenario(file, {
        overrideName: (name) => uniqueScenarioName(name, documents, 'importé'),
      })
      addDocument(imported)
      await tacticalBoardRepository.setSetting('activeScenarioId', imported.id)
      await refreshAssetUrls()
      notify('Scénario importé et ouvert.', 'success')
    } catch (error) {
      notify(errorMessage(error), 'error')
    }
  }

  const handleExportPng = async () => {
    if (!activeScenario || !boardRef.current) return
    const board = boardRef.current
    const previousCellSize = board.style.getPropertyValue('--cell-size')
    board.style.setProperty('--cell-size', '64px')
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    try {
      await exportBoardToPng(board, {
        filename: activeScenario.name,
        width: activeScenario.grid.columns * 64 + 2,
        height: activeScenario.grid.rows * 64 + 2,
        pixelRatio: 2,
      })
      notify('Image PNG générée.', 'success')
    } catch (error) {
      notify(errorMessage(error), 'error')
    } finally {
      if (previousCellSize) board.style.setProperty('--cell-size', previousCellSize)
      else board.style.removeProperty('--cell-size')
    }
  }

  const handleExportAllScenarios = async () => {
    try {
      await flushAutosaveOrThrow()
      await exportAllScenariosJson(orderedDocuments)
      notify('Bibliothèque complète exportée.', 'success')
    } catch (error) {
      notify(errorMessage(error), 'error')
    }
  }

  const createFaction = async (draft: FactionDraft) => {
    safelyCommit({
      type: 'addFaction',
      faction: { id: createEntityId('faction'), name: draft.name, color: draft.color },
    })
  }

  const editFaction = async (id: string, draft: FactionDraft) => {
    safelyCommit({ type: 'updateFaction', factionId: id, changes: { name: draft.name, color: draft.color } })
  }

  const deleteFaction = async (id: string) => {
    if (activeScenario?.units.some((unit) => unit.factionId === id)) {
      throw new Error('Réaffectez les unités de cette faction avant de la supprimer.')
    }
    safelyCommit({ type: 'removeFaction', factionId: id })
    if (activeFactionId === id) setActiveFactionId(activeScenario?.factions.find((faction) => faction.id !== id)?.id ?? null)
  }

  const createCustomType = async (draft: CustomTypeDraft) => {
    if (!draft.image) throw new Error('Choisissez une image.')
    const asset = await createImageAsset(draft.image)
    await tacticalBoardRepository.saveAsset(asset)
    const unitType: CustomUnitType = {
      id: createEntityId('type'),
      name: draft.name,
      category: draft.category,
      defaultColor: draft.color,
      icon: { kind: 'asset', assetId: asset.id },
      builtin: false,
      archived: false,
    }
    safelyCommit({ type: 'addCustomUnitType', unitType })
    await refreshAssetUrls()
    setSelectedTypeId(unitType.id)
    notify('Type personnalisé ajouté.', 'success')
  }

  const editCustomType = async (id: string, draft: CustomTypeDraft) => {
    let icon = activeScenario?.customUnitTypes.find((unitType) => unitType.id === id)?.icon
    if (draft.image) {
      const asset = await createImageAsset(draft.image)
      await tacticalBoardRepository.saveAsset(asset)
      icon = { kind: 'asset', assetId: asset.id }
      await refreshAssetUrls()
    }
    safelyCommit({
      type: 'updateCustomUnitType',
      unitTypeId: id,
      changes: { name: draft.name, category: draft.category, defaultColor: draft.color, ...(icon ? { icon } : {}) },
    })
  }

  const deleteCustomType = async (id: string) => {
    safelyCommit({ type: 'archiveCustomUnitType', unitTypeId: id })
    if (selectedTypeId === id) setSelectedTypeId(null)
  }

  const placeUnit = (unitType: UnitType, faction: Faction, position: Position) => {
    if (!activeScenario) return
    const unitId = createEntityId('unit')
    const prefix = unitType.name
    const usedNames = new Set(activeScenario.units.map((unit) => unit.name))
    let sequence = 1
    while (usedNames.has(`${prefix} ${sequence}`)) sequence += 1
    const placed = safelyCommit({
      type: 'placeUnit',
      unitId,
      typeId: unitType.id,
      factionId: faction.id,
      position,
      name: `${prefix} ${sequence}`,
    })
    if (placed) {
      setSelection({ kind: 'unit', id: unitId })
      if (!desktopLayout) setRightPanelOpen(false)
    }
  }

  const addArrow = (start: Position, end: Position, style: 'attack' | 'movement' | 'support', color: string) => {
    safelyCommit({
      type: 'addAnnotation',
      annotation: { id: createEntityId('arrow'), kind: 'arrow', start, end, style, color },
    })
  }

  const addMarker = (position: Position, markerType: MarkerAnnotation['markerType'], color: string) => {
    const labels: Record<MarkerAnnotation['markerType'], string> = {
      objective: 'Objectif',
      danger: 'Danger',
      rally: 'Regroupement',
    }
    safelyCommit({
      type: 'addAnnotation',
      annotation: {
        id: createEntityId('marker'),
        kind: 'marker',
        position,
        markerType,
        color,
        label: labels[markerType],
      },
    })
  }

  const updateUnit = (unitId: string, changes: UnitEditableChanges) => {
    safelyCommit({ type: 'updateUnit', unitId, changes })
  }

  const rallyUnit = (unitId: string) => {
    const ownFaction = activeScenario?.factions.find((faction) => faction.role === 'own')
    if (!ownFaction) {
      notify('La faction « Mes forces » est introuvable.', 'error')
      return
    }
    const changed = safelyCommit({
      type: 'updateUnit',
      unitId,
      changes: { factionId: ownFaction.id, status: 'active' },
    })
    if (changed) notify('Unité ralliée à vos forces.', 'success')
  }

  const neutralizeUnit = (unitId: string) => {
    const changed = safelyCommit({
      type: 'updateUnit',
      unitId,
      changes: { status: 'neutralized' },
    })
    if (changed) notify('Obstacle neutralisé.', 'success')
  }

  const changeSelectedUnitsStatus = (status: UnitStatus) => {
    if (selectedUnits.length < 2) return
    const changed = safelyCommit({
      type: 'updateUnits',
      unitIds: selectedUnits.map((unit) => unit.id),
      changes: { status },
    })
    if (changed) {
      notify(`Statut mis à jour pour ${selectedUnits.length} unités.`, 'success')
    }
  }

  const changeSelectedUnitsFaction = (factionId: string) => {
    const faction = activeScenario?.factions.find(
      (candidate) => candidate.id === factionId,
    )
    if (selectedUnits.length < 2 || !faction) return
    const changed = safelyCommit({
      type: 'updateUnits',
      unitIds: selectedUnits.map((unit) => unit.id),
      changes: { factionId },
    })
    if (changed) {
      notify(
        `${selectedUnits.length} unités affectées à « ${faction.name} ».`,
        'success',
      )
    }
  }

  const rallySelectedUnits = () => {
    if (!ownFaction || !canRallySelectedUnits) return
    const changed = safelyCommit({
      type: 'updateUnits',
      unitIds: selectedUnits.map((unit) => unit.id),
      changes: { factionId: ownFaction.id, status: 'active' },
    })
    if (changed) {
      notify(`${selectedUnits.length} unités ralliées à vos forces.`, 'success')
    }
  }

  const neutralizeSelectedUnits = () => {
    if (!canNeutralizeSelectedUnits) return
    const changed = safelyCommit({
      type: 'updateUnits',
      unitIds: selectedUnits.map((unit) => unit.id),
      changes: { status: 'neutralized' },
    })
    if (changed) {
      notify(`${selectedUnits.length} obstacles neutralisés.`, 'success')
    }
  }

  const reachObjective = (unitId: string, objectiveUnitId: string) => {
    const changed = safelyCommit({ type: 'reachObjective', unitId, objectiveUnitId })
    if (!changed) return
    leaveBoardOnlyMode()
    setSelection({ kind: 'unit', id: unitId })
    setObjectiveReachedOpen(true)
    notify('Objectif final atteint.', 'success')
  }

  const updateScenarioProgress = (current: string) => {
    const changed = safelyCommit({ type: 'updateScenarioProgress', current })
    if (changed) notify(`Progression avancée au ${formatScenarioDate(current)}.`, 'success')
    setProgressOpen(false)
  }

  const updateScenarioDetails = (
    objective: string,
    period?: ScenarioDocumentV1['period'],
  ) => {
    const changed = safelyCommit({
      type: 'updateScenarioMetadata',
      changes: { objective, period },
    })
    if (changed) notify('Objectif et période mis à jour.', 'success')
    setScenarioDetailsOpen(false)
  }

  const updateAnnotation = (annotationId: string, changes: AnnotationChanges) => {
    safelyCommit({ type: 'updateAnnotation', annotationId, changes })
  }

  const applyBoardSettings = (rows: number, columns: number, showCoordinates: boolean) => {
    if (!activeScenario) return
    try {
      const impact = previewResize(activeScenario, rows, columns)
      if (
        (impact.unitCount || impact.annotationCount) &&
        !window.confirm(
          `Cette réduction retirera ${impact.unitCount} unité(s) et ${impact.annotationCount} annotation(s). Continuer ?`,
        )
      ) return
      if (rows !== activeScenario.grid.rows || columns !== activeScenario.grid.columns) {
        safelyCommit({ type: 'resizeGrid', rows, columns, confirmRemoval: true })
      }
      if (showCoordinates !== activeScenario.grid.showCoordinates) {
        safelyCommit({ type: 'setCoordinatesVisibility', visible: showCoordinates })
      }
      setBoardSettingsOpen(false)
    } catch (error) {
      notify(errorMessage(error), 'error')
    }
  }

  const clearBoard = () => {
    if (!activeScenario) return
    if (
      window.confirm(
        `Vider le plateau ? ${activeScenario.units.length} unité(s) et ${activeScenario.annotations.length} annotation(s) seront retirées.`,
      )
    ) {
      safelyCommit({ type: 'clearBoard' })
      setSelection(null)
      setBoardSettingsOpen(false)
    }
  }

  const recenterBoard = useCallback(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    viewport.scrollTo({
      left: Math.max(0, (viewport.scrollWidth - viewport.clientWidth) / 2),
      top: Math.max(0, (viewport.scrollHeight - viewport.clientHeight) / 2),
      behavior: 'smooth',
    })
  }, [])

  const fitBoard = useCallback(() => {
    if (!activeScenario || !viewportRef.current) return
    const viewport = viewportRef.current
    const next = Math.min(
      2,
      Math.max(
        0.4,
        Math.min(
          (viewport.clientWidth - 112) / (activeScenario.grid.columns * 64),
          (viewport.clientHeight - 112) / (activeScenario.grid.rows * 64),
        ),
      ),
    )
    setZoom(next)
    requestAnimationFrame(recenterBoard)
  }, [activeScenario, recenterBoard, setZoom])

  useEffect(() => {
    if (!hydrated || !activeScenario || lastFittedScenarioId.current === activeScenario.id) return
    lastFittedScenarioId.current = activeScenario.id
    const frame = requestAnimationFrame(fitBoard)
    return () => cancelAnimationFrame(frame)
  }, [activeScenario, fitBoard, hydrated])

  if (initialError) {
    return (
      <main className={styles.loading}>
        <div className={styles.loadingCard}>
          <div className={styles.loadingMark}><X aria-hidden /></div>
          <strong>Impossible d’ouvrir les données locales</strong>
          <span>{initialError}</span>
          <Button onClick={() => window.location.reload()} variant="primary">Réessayer</Button>
        </div>
      </main>
    )
  }

  if (!hydrated || !activeScenario) {
    return (
      <main className={styles.loading}>
        <div className={styles.loadingCard}>
          <div className={styles.loadingMark}><Shield aria-hidden /></div>
          <span>Initialisation du centre tactique…</span>
        </div>
      </main>
    )
  }

  const saveState = saveStateFor(saveSnapshot)

  return (
    <div
      className={`${styles.app} ${boardOnlyMode ? styles.appBoardOnly : ''}`}
      data-board-only={boardOnlyMode ? 'true' : 'false'}
      ref={appRef}
    >
      {!boardOnlyMode ? (
        <TopBar
        activeScenarioId={activeScenario.id}
        canRedo={Boolean(history?.future.length)}
        canUndo={Boolean(history?.past.length)}
        onCreateScenario={() => setNewScenarioOpen(true)}
        onCreateNextScenario={(sourceScenarioId) => setNextScenarioSourceId(sourceScenarioId)}
        onDeleteScenario={deleteScenario}
        onDuplicateScenario={duplicateScenario}
        onEditScenarioDetails={() => setScenarioDetailsOpen(true)}
        onExportAllScenarios={handleExportAllScenarios}
        onExportJson={async () => {
          try {
            await exportScenarioJson(activeScenario)
          } catch (error) {
            notify(errorMessage(error), 'error')
          }
        }}
        onExportPng={handleExportPng}
        onForceSave={requestForceSave}
        onImportScenario={handleImport}
        onOpenInspector={() => setRightPanelOpen(true)}
        onOpenLibrary={() => setLeftPanelOpen(true)}
        onRedo={redo}
        onRenameScenario={renameScenario}
        onSelectScenario={(id) => void switchScenario(id)}
        onSetScenarioStatus={setScenarioStatus}
        onUndo={undo}
        saveDetail={saveSnapshot.error?.message}
        saveState={saveState}
        scenarios={orderedDocuments.map(({ id, name, status, updatedAt }) => ({
          id,
          name,
          status,
          updatedAt,
        }))}
        />
      ) : null}

      <main
        className={`${styles.workspace} ${boardOnlyMode ? styles.workspaceBoardOnly : ''}`}
      >
        {!boardOnlyMode ? (
          <div className={styles.leftPanel}>
          <LibraryPanel
            activeFactionId={placementFaction?.id ?? null}
            activeUnitTypeId={placementType?.id ?? null}
            factions={activeScenario.factions}
            onClose={() => setLeftPanelOpen(false)}
            onCreateCustomType={createCustomType}
            onCreateFaction={createFaction}
            onDeleteCustomType={deleteCustomType}
            onDeleteFaction={deleteFaction}
            onEditCustomType={editCustomType}
            onEditFaction={editFaction}
            onSelectFaction={setActiveFactionId}
            onSelectUnitType={setSelectedTypeId}
            open={leftPanelOpen || desktopLayout}
            resolveAssetUrl={(assetId) => assetUrls[assetId]}
            unitTypes={unitTypes}
          />
          </div>
        ) : null}

        <section className={styles.center} aria-label="Éditeur tactique">
          {!boardOnlyMode ? (
            <BoardToolbar
            tool={tool}
            onToolChange={setTool}
            canPlace={Boolean(placementType && placementFaction)}
            arrowStyle={arrowStyle}
            arrowColor={arrowColor}
            markerKind={markerKind}
            markerColor={markerColor}
            onArrowStyleChange={setArrowStyle}
            onArrowColorChange={setArrowColor}
            onMarkerKindChange={setMarkerKind}
            onMarkerColorChange={setMarkerColor}
            />
          ) : null}
          {!boardOnlyMode ? (
            <div className={styles.boardMeta}>
            <div className={styles.scenarioSummary}>
              <div className={styles.scenarioHeading}>
                <span className={styles.scenarioPulse}>{activeScenario.name}</span>
                {activeScenario.status === 'archived' ? (
                  <span className={styles.archivedBadge}>Archivé</span>
                ) : null}
                {activeScenario.period ? (
                  <span className={styles.scenarioPeriod}>
                    {activeScenario.period.start
                      ? formatScenarioDate(activeScenario.period.start)
                      : 'Début libre'}
                    {' → '}
                    {activeScenario.period.target
                      ? formatScenarioDate(activeScenario.period.target)
                      : 'sans échéance'}
                    {activeScenario.period.current &&
                    activeScenario.period.current !== activeScenario.period.start
                      ? ` · au ${formatScenarioDate(activeScenario.period.current)}`
                      : ''}
                  </span>
                ) : null}
              </div>
              {activeScenario.objective ? (
                <span className={styles.scenarioObjective} title={activeScenario.objective}>
                  {activeScenario.objective}
                </span>
              ) : null}
            </div>
            <span className={styles.metaDesktop}>
              {activeScenario.grid.columns} × {activeScenario.grid.rows} · {activeScenario.units.length} unité{activeScenario.units.length > 1 ? 's' : ''}
            </span>
            <span className={styles.metaSpacer} />
            {activeScenario.period ? (
              <button
                className={styles.metaAction}
                type="button"
                onClick={() => setProgressOpen(true)}
                title="Avancer la date du scénario"
              >
                <CalendarDays aria-hidden /><span>Avancer</span>
              </button>
            ) : null}
            <button className={styles.metaAction} type="button" onClick={() => setBoardSettingsOpen(true)}>
              <Settings2 aria-hidden /><span>Plateau</span>
            </button>
            <button className={styles.metaAction} type="button" onClick={fitBoard} title="Ajuster le plateau à la vue">
              <Focus aria-hidden /><span>Ajuster</span>
            </button>
            <button className={styles.metaAction} type="button" onClick={recenterBoard} title="Recentrer le plateau">
              <Crosshair aria-hidden /><span>Recentrer</span>
            </button>
            <button
              aria-label="Activer le mode plein écran du plateau"
              className={styles.metaAction}
              onClick={enterBoardOnlyMode}
              title="Afficher seulement le plateau"
              type="button"
            >
              <Maximize2 aria-hidden /><span>Plein écran</span>
            </button>
            <div className={styles.zoomGroup} aria-label="Contrôles de zoom">
              <button type="button" aria-label="Réduire le zoom" onClick={() => setZoom(zoom - 0.1)}><Minus aria-hidden /></button>
              <span className={styles.zoomValue}>{Math.round(zoom * 100)}%</span>
              <button type="button" aria-label="Augmenter le zoom" onClick={() => setZoom(zoom + 0.1)}><Plus aria-hidden /></button>
            </div>
            </div>
          ) : null}
          <Board
            ref={boardRef}
            scenario={activeScenario}
            tool={tool}
            zoom={zoom}
            selection={selection}
            placementType={placementType}
            placementFaction={placementFaction}
            arrowStyle={arrowStyle}
            arrowColor={arrowColor}
            markerKind={markerKind}
            markerColor={markerColor}
            assetUrls={assetUrls}
            viewportRef={viewportRef}
            onSelectionChange={(nextSelection) => {
              setMultiSelectionOpen(false)
              setSelection(nextSelection)
              if (nextSelection && !desktopLayout) setRightPanelOpen(false)
            }}
            onPlaceUnit={placeUnit}
            onMoveUnit={(unitId, position) => safelyCommit({ type: 'moveUnit', unitId, to: position })}
            onMoveUnits={(unitIds, delta) => safelyCommit({ type: 'moveUnits', unitIds, delta })}
            onReachObjective={reachObjective}
            onDeleteUnit={(unitId) => safelyCommit({ type: 'removeUnit', unitId })}
            onAddArrow={addArrow}
            onAddMarker={addMarker}
            onDeleteAnnotation={(annotationId) => safelyCommit({ type: 'removeAnnotation', annotationId })}
            onNotify={(message) => notify(message)}
          />
        </section>

        {!boardOnlyMode ? (
          <div className={styles.rightPanel}>
          <InspectorPanel
            annotation={selectedAnnotation}
            factions={activeScenario.factions}
            onChangeUnitType={(unitId, typeId) => safelyCommit({ type: 'changeUnitType', unitId, typeId, resetAppearance: true })}
            onClose={() => setRightPanelOpen(false)}
            onDeleteAnnotation={(annotationId) => {
              safelyCommit({ type: 'removeAnnotation', annotationId })
              setSelection(null)
            }}
            onDeleteUnit={(unitId) => {
              safelyCommit({ type: 'removeUnit', unitId })
              setSelection(null)
            }}
            onClearUnitsSelection={() => {
              setMultiSelectionOpen(false)
              setSelection(null)
              setRightPanelOpen(false)
            }}
            onNeutralizeUnits={
              canNeutralizeSelectedUnits ? neutralizeSelectedUnits : undefined
            }
            onRallyUnits={canRallySelectedUnits ? rallySelectedUnits : undefined}
            onUpdateUnitsFaction={changeSelectedUnitsFaction}
            onUpdateUnitsStatus={changeSelectedUnitsStatus}
            onUpdateAnnotation={updateAnnotation}
            onUpdateUnit={updateUnit}
            onRallyUnit={
              selectedUnit &&
              activeScenario.factions.find((faction) => faction.id === selectedUnit.factionId)
                ?.role === 'rally'
                ? rallyUnit
                : undefined
            }
            onNeutralizeUnit={
              selectedUnit &&
              activeScenario.factions.find((faction) => faction.id === selectedUnit.factionId)
                ?.role === 'obstacle' &&
              selectedUnit.status !== 'neutralized'
                ? neutralizeUnit
                : undefined
            }
            open={rightPanelOpen || desktopLayout}
            resolveAssetUrl={(assetId) => assetUrls[assetId]}
            unit={selectedUnit}
            units={multiSelectionOpen ? selectedUnits : []}
            unitTypes={unitTypes}
          />
          </div>
        ) : null}
      </main>

      {!boardOnlyMode ? (
        <nav className={styles.mobileBottomBar} aria-label="Navigation mobile">
        <button type="button" onClick={() => setLeftPanelOpen(true)}>
          <PanelLeft aria-hidden />
          Unités
        </button>
        <button type="button" onClick={() => setTool('select')}><Grid3X3 aria-hidden />Sélection</button>
        <button
          type="button"
          onClick={() => setRightPanelOpen(true)}
        >
          <PanelRight aria-hidden />{multiSelectionOpen ? 'Actions' : 'Propriétés'}
        </button>
        <button type="button" disabled={!history?.past.length} onClick={undo}><Undo2 aria-hidden />Annuler</button>
        </nav>
      ) : null}

      {boardOnlyMode ? (
        <button
          aria-keyshortcuts="Escape"
          aria-label="Quitter le mode plein écran"
          className={styles.boardOnlyExit}
          onClick={leaveBoardOnlyMode}
          ref={boardOnlyExitRef}
          title="Quitter le plein écran (Échap)"
          type="button"
        >
          <Minimize2 aria-hidden="true" />
        </button>
      ) : null}

      <NewScenarioModal
        open={newScenarioOpen}
        onClose={() => setNewScenarioOpen(false)}
        onCreate={(name, rows, columns, metadata) =>
          void createScenario(name, rows, columns, metadata)
        }
      />
      <NextScenarioModal
        onChoose={(copyOwnForces) => void createFollowingScenario(copyOwnForces)}
        onClose={() => setNextScenarioSourceId(null)}
        open={Boolean(nextScenarioSourceId)}
        sourceName={nextScenarioSource?.name ?? activeScenario.name}
      />
      <ObjectiveReachedModal
        onArchiveAndContinue={() => {
          safelyCommit({ type: 'setScenarioStatus', status: 'archived' })
          setObjectiveReachedOpen(false)
          setNextScenarioSourceId(activeScenario.id)
        }}
        onContinue={() => setObjectiveReachedOpen(false)}
        open={objectiveReachedOpen}
      />
      <ProgressDateModal
        current={activeScenario.period?.current ?? activeScenario.period?.start}
        onApply={updateScenarioProgress}
        onClose={() => setProgressOpen(false)}
        open={progressOpen}
      />
      <ScenarioDetailsModal
        objective={activeScenario.objective}
        onApply={updateScenarioDetails}
        onClose={() => setScenarioDetailsOpen(false)}
        open={scenarioDetailsOpen}
        period={activeScenario.period}
      />
      <BoardSettingsModal
        open={boardSettingsOpen}
        grid={activeScenario.grid}
        unitCount={activeScenario.units.length}
        annotationCount={activeScenario.annotations.length}
        onClose={() => setBoardSettingsOpen(false)}
        onApply={applyBoardSettings}
        onClear={clearBoard}
      />

      {saveSnapshot.state === 'error' && (
        <div className={styles.errorBanner} role="alert">
          <p>La sauvegarde locale a échoué : {saveSnapshot.error?.message}</p>
          <button type="button" onClick={() => void retryAutosave()}>Réessayer</button>
          <button
            type="button"
            onClick={() =>
              void exportScenarioJson(activeScenario).catch((error: unknown) =>
                notify(errorMessage(error), 'error'),
              )
            }
          >
            Exporter un secours
          </button>
        </div>
      )}

      {notification && (
        <div
          className={`${styles.toast} ${notification.tone === 'success' ? styles.toastSuccess : ''} ${notification.tone === 'error' ? styles.toastError : ''}`}
          role={notification.tone === 'error' ? 'alert' : 'status'}
        >
          <span>{notification.message}</span>
          <button type="button" aria-label="Fermer" onClick={clearNotification}>×</button>
        </div>
      )}
    </div>
  )
}
