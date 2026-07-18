import { beforeEach, describe, expect, it } from 'vitest'

import { applyCommand, createDefaultScenario, type ScenarioDocumentV1 } from '../domain'
import { selectActiveScenario, useAppStore, type AppStoreState } from './appStore'

function makeScenario(id: string, name: string): ScenarioDocumentV1 {
  return createDefaultScenario(name, {
    id,
    now: '2026-07-18T10:00:00.000Z',
    blueFactionId: `${id}-blue`,
    redFactionId: `${id}-red`,
  })
}

function resetStore(): void {
  useAppStore.setState({
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
  })
}

function activeState(): AppStoreState & { history: NonNullable<AppStoreState['history']> } {
  const state = useAppStore.getState()
  if (!state.history) throw new Error('Le store aurait dû contenir un scénario actif.')
  return state as AppStoreState & { history: NonNullable<AppStoreState['history']> }
}

beforeEach(resetStore)

describe('appStore — commandes et historique', () => {
  it('committe une commande dans le document actif et sa liste persistable', () => {
    const initial = makeScenario('alpha', 'Alpha')
    useAppStore.getState().hydrate([initial], initial.id)

    const placed = useAppStore.getState().commit({
      type: 'placeUnit',
      unitId: 'unit-1',
      typeId: 'infantry',
      factionId: 'alpha-blue',
      position: { row: 2, column: 3 },
      at: '2026-07-18T10:05:00.000Z',
    })
    const state = activeState()

    expect(placed?.units).toHaveLength(1)
    expect(state.history.present).toBe(placed)
    expect(state.history.past).toEqual([initial])
    expect(state.history.future).toEqual([])
    expect(state.documents).toHaveLength(1)
    expect(state.documents[0]).toBe(placed)
    expect(state.history.present.updatedAt).toBe('2026-07-18T10:05:00.000Z')
  })

  it('ne crée pas d’entrée d’historique pour une commande sans effet', () => {
    const initial = makeScenario('alpha', 'Alpha')
    useAppStore.getState().hydrate([initial])

    const returned = useAppStore.getState().commit({
      type: 'setCoordinatesVisibility',
      visible: true,
      at: '2099-01-01T00:00:00.000Z',
    })
    const state = activeState()

    expect(returned).toBe(initial)
    expect(state.history.present).toBe(initial)
    expect(state.history.past).toEqual([])
    expect(state.history.future).toEqual([])
  })

  it('annule puis rétablit la commande et synchronise la liste de documents', () => {
    const initial = makeScenario('alpha', 'Alpha')
    useAppStore.getState().hydrate([initial])
    const placed = useAppStore.getState().commit({
      type: 'placeUnit',
      unitId: 'unit-1',
      typeId: 'tank',
      factionId: 'alpha-blue',
      position: { row: 0, column: 0 },
    })!

    const undone = useAppStore.getState().undo()
    expect(undone).toBe(initial)
    expect(activeState().documents[0]).toBe(initial)
    expect(activeState().history.future).toEqual([placed])

    const redone = useAppStore.getState().redo()
    expect(redone).toBe(placed)
    expect(activeState().documents[0]).toBe(placed)
    expect(activeState().history.future).toEqual([])
  })

  it('efface la branche de rétablissement après un nouveau commit', () => {
    const initial = makeScenario('alpha', 'Alpha')
    useAppStore.getState().hydrate([initial])
    useAppStore.getState().commit({ type: 'renameScenario', name: 'Première branche' })
    useAppStore.getState().undo()
    expect(activeState().history.future).toHaveLength(1)

    useAppStore.getState().commit({ type: 'renameScenario', name: 'Seconde branche' })

    expect(activeState().history.present.name).toBe('Seconde branche')
    expect(activeState().history.future).toEqual([])
  })

  it('conserve seulement les 100 états précédents', () => {
    const initial = makeScenario('alpha', 'Alpha')
    useAppStore.getState().hydrate([initial])

    for (let index = 1; index <= 125; index += 1) {
      useAppStore.getState().commit({
        type: 'updateFaction',
        factionId: 'alpha-blue',
        changes: { name: `Faction ${index}` },
        at: `2026-07-18T10:${String(index % 60).padStart(2, '0')}:00.000Z`,
      })
    }

    const state = activeState()
    expect(state.history.past).toHaveLength(100)
    expect(state.history.past[0]?.factions[0]?.name).toBe('Faction 25')
    expect(state.history.present.factions[0]?.name).toBe('Faction 125')
    expect(state.documents.find((document) => document.id === 'alpha')).toBe(
      state.history.present,
    )
  })
})

describe('appStore — scénarios et sélection', () => {
  it('conserve une sélection multiple dans le panneau gauche sans ouvrir l’inspecteur', () => {
    const initial = makeScenario('alpha', 'Alpha')
    const first = applyCommand(initial, {
      type: 'placeUnit',
      unitId: 'unit-1',
      typeId: 'infantry',
      factionId: 'alpha-blue',
      position: { row: 0, column: 0 },
    }).document
    const populated = applyCommand(first, {
      type: 'placeUnit',
      unitId: 'unit-2',
      typeId: 'tank',
      factionId: 'alpha-blue',
      position: { row: 0, column: 1 },
    }).document
    useAppStore.getState().hydrate([populated])
    useAppStore.getState().setLeftPanelOpen(true)

    useAppStore.getState().setSelection({
      kind: 'units',
      ids: ['unit-1', 'unit-2'],
    })

    expect(useAppStore.getState().selection).toEqual({
      kind: 'units',
      ids: ['unit-1', 'unit-2'],
    })
    expect(useAppStore.getState().leftPanelOpen).toBe(true)
    expect(useAppStore.getState().rightPanelOpen).toBe(false)
  })

  it('normalise une sélection multiple quand une unité disparaît', () => {
    const initial = makeScenario('alpha', 'Alpha')
    const first = applyCommand(initial, {
      type: 'placeUnit',
      unitId: 'unit-1',
      typeId: 'infantry',
      factionId: 'alpha-blue',
      position: { row: 0, column: 0 },
    }).document
    const populated = applyCommand(first, {
      type: 'placeUnit',
      unitId: 'unit-2',
      typeId: 'tank',
      factionId: 'alpha-blue',
      position: { row: 0, column: 1 },
    }).document
    useAppStore.getState().hydrate([populated])
    useAppStore.getState().setSelection({
      kind: 'units',
      ids: ['unit-1', 'unit-2'],
    })

    useAppStore.getState().commit({ type: 'removeUnit', unitId: 'unit-1' })

    expect(useAppStore.getState().selection).toEqual({
      kind: 'unit',
      id: 'unit-2',
    })
  })

  it('bascule de scénario et réinitialise l’état éphémère associé', () => {
    const alpha = makeScenario('alpha', 'Alpha')
    const bravo = makeScenario('bravo', 'Bravo')
    useAppStore.getState().hydrate([alpha, bravo], alpha.id)
    useAppStore.getState().setSelectedTypeId('tank')
    useAppStore.getState().setSelection({ kind: 'unit', id: 'not-important' })
    useAppStore.getState().setRightPanelOpen(true)

    const activated = useAppStore.getState().setActiveScenario(bravo.id)
    const state = activeState()

    expect(activated).toBe(bravo)
    expect(state.history.present).toBe(bravo)
    expect(state.history.past).toEqual([])
    expect(state.activeFactionId).toBe('bravo-blue')
    expect(state.selectedTypeId).toBeNull()
    expect(state.selection).toBeNull()
    expect(state.tool).toBe('select')
    expect(state.rightPanelOpen).toBe(false)
    expect(selectActiveScenario(state)).toBe(bravo)
  })

  it('ne modifie rien si le scénario demandé est inconnu', () => {
    const alpha = makeScenario('alpha', 'Alpha')
    useAppStore.getState().hydrate([alpha])
    const before = useAppStore.getState()

    const activated = useAppStore.getState().setActiveScenario('missing')

    expect(activated).toBeNull()
    expect(useAppStore.getState()).toBe(before)
  })

  it('efface une sélection devenue invalide après commit et ferme son inspecteur', () => {
    const initial = makeScenario('alpha', 'Alpha')
    const populated = applyCommand(initial, {
      type: 'placeUnit',
      unitId: 'unit-1',
      typeId: 'infantry',
      factionId: 'alpha-blue',
      position: { row: 1, column: 1 },
    }).document
    useAppStore.getState().hydrate([populated])
    useAppStore.getState().setSelection({ kind: 'unit', id: 'unit-1' })
    useAppStore.getState().setRightPanelOpen(true)
    expect(useAppStore.getState().rightPanelOpen).toBe(true)

    useAppStore.getState().commit({ type: 'removeUnit', unitId: 'unit-1' })

    expect(useAppStore.getState().selection).toBeNull()
    expect(useAppStore.getState().rightPanelOpen).toBe(false)
  })

  it('efface une sélection devenue invalide lors de l’annulation', () => {
    const initial = makeScenario('alpha', 'Alpha')
    useAppStore.getState().hydrate([initial])
    useAppStore.getState().commit({
      type: 'placeUnit',
      unitId: 'unit-1',
      typeId: 'infantry',
      factionId: 'alpha-blue',
      position: { row: 0, column: 0 },
    })
    useAppStore.getState().setSelection({ kind: 'unit', id: 'unit-1' })
    useAppStore.getState().setRightPanelOpen(true)

    useAppStore.getState().undo()

    expect(useAppStore.getState().selection).toBeNull()
    expect(useAppStore.getState().rightPanelOpen).toBe(false)
  })
})
