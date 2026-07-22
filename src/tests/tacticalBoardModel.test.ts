import { describe, expect, it } from 'vitest'

import {
  applyCommand,
  previewMoveUnits,
  previewResize,
} from '@/tactical-board/model/applyScenarioCommand'
import { deriveSelectionModel } from '@/tactical-board/model/boardSelection'
import { createNextScenario } from '@/tactical-board/model/scenarioContinuity'
import {
  createDefaultScenario,
  migrateScenarioDocumentV1,
} from '@/tactical-board/model/scenarioDocument'
import {
  applyCommandToHistory,
  createHistory,
  pushHistory,
  redoHistory,
  undoHistory,
} from '@/tactical-board/model/scenarioHistory'
import {
  type CustomUnitType,
  type LegacyScenarioDocumentV1,
  type ScenarioDocumentV1,
} from '@/tactical-board/model/tacticalBoardTypes'

const TEST_DATE = '2026-07-18T00:00:00.000Z'

function scenario(): ScenarioDocumentV1 {
  return createDefaultScenario('Opération test', {
    id: 'scenario-1',
    now: TEST_DATE,
    blueFactionId: 'blue',
    redFactionId: 'red',
  })
}

function place(
  document: ScenarioDocumentV1,
  unitId: string,
  row: number,
  column: number,
  typeId = 'infantry',
  factionId = 'blue',
): ScenarioDocumentV1 {
  return applyCommand(document, {
    type: 'placeUnit',
    unitId,
    typeId,
    factionId,
    position: { row, column },
  }).document
}

const droneType: CustomUnitType = {
  id: 'drone',
  name: 'Drone',
  category: 'Aérien',
  defaultColor: '#12abcd',
  icon: { kind: 'asset', assetId: 'asset-drone' },
  builtin: false,
  archived: false,
}

describe('modèle essentiel de Tactical Board', () => {
  it('crée le document courant et migre un document V1 sans perdre son identité', () => {
    const current = scenario()
    const legacy: LegacyScenarioDocumentV1 = {
      formatVersion: 1,
      id: 'legacy',
      name: 'Ancien scénario',
      createdAt: TEST_DATE,
      updatedAt: TEST_DATE,
      grid: { rows: 7, columns: 9, showCoordinates: false },
      factions: current.factions.slice(0, 2).map(({ id, name, color }) => ({ id, name, color })),
      customUnitTypes: [],
      units: [],
      annotations: [],
    }

    const migrated = migrateScenarioDocumentV1(legacy)

    expect(current).toMatchObject({
      formatVersion: 2,
      id: 'scenario-1',
      objective: '',
      status: 'active',
      grid: { rows: 8, columns: 8, showCoordinates: true },
    })
    expect(migrated).toMatchObject({
      formatVersion: 2,
      id: 'legacy',
      name: 'Ancien scénario',
      objective: '',
      status: 'active',
      grid: legacy.grid,
    })
    expect(migrated.factions.map((faction) => faction.role)).toEqual([
      'own',
      'obstacle',
      'rally',
      'uncertain',
      'objective',
    ])
    expect(legacy).not.toHaveProperty('objective')
  })

  it('fige le snapshot au placement et réserve les changements de type aux futurs placements', () => {
    const withType = applyCommand(scenario(), {
      type: 'addCustomUnitType',
      unitType: droneType,
    }).document
    const first = place(withType, 'old', 0, 0, 'drone')
    const edited = applyCommand(first, {
      type: 'updateCustomUnitType',
      unitTypeId: 'drone',
      changes: {
        name: 'Drone Mk II',
        defaultColor: '#abcdef',
        icon: { kind: 'catalog', name: 'plane' },
      },
    }).document
    const second = place(edited, 'new', 0, 1, 'drone')
    const archived = applyCommand(second, {
      type: 'archiveCustomUnitType',
      unitTypeId: 'drone',
    }).document

    expect(archived.units.find((unit) => unit.id === 'old')).toMatchObject({
      name: 'Drone',
      color: '#12abcd',
      typeSnapshot: { name: 'Drone', defaultColor: '#12abcd' },
    })
    expect(archived.units.find((unit) => unit.id === 'new')).toMatchObject({
      name: 'Drone Mk II',
      color: '#abcdef',
      typeSnapshot: { name: 'Drone Mk II', defaultColor: '#abcdef' },
    })
    expect(archived.customUnitTypes[0]?.archived).toBe(true)
    expect(() => place(archived, 'forbidden', 0, 2, 'drone')).toThrowError(
      expect.objectContaining({ code: 'INVALID_REFERENCE' }),
    )
  })

  it('place et déplace une unité sans accepter collision ou sortie de grille', () => {
    const document = place(place(scenario(), 'alpha', 0, 0), 'bravo', 1, 1)
    const moved = applyCommand(document, {
      type: 'moveUnit',
      unitId: 'alpha',
      to: { row: 2, column: 3 },
    }).document

    expect(moved.units.find((unit) => unit.id === 'alpha')?.position).toEqual({
      row: 2,
      column: 3,
    })
    expect(() => place(document, 'occupied', 0, 0)).toThrowError(
      expect.objectContaining({ code: 'CELL_OCCUPIED' }),
    )
    expect(() =>
      applyCommand(moved, {
        type: 'moveUnit',
        unitId: 'alpha',
        to: { row: 1, column: 1 },
      }),
    ).toThrowError(expect.objectContaining({ code: 'CELL_OCCUPIED' }))
    expect(document.units[0]?.position).toEqual({ row: 0, column: 0 })
  })

  it('prévisualise et déplace une formation de manière atomique', () => {
    const document = place(
      place(place(scenario(), 'alpha', 1, 1), 'bravo', 1, 2),
      'blocker',
      4,
      4,
    )

    expect(previewMoveUnits(document, ['alpha', 'bravo'], { row: 1, column: 1 })).toEqual({
      changed: true,
      moves: [
        { unitId: 'alpha', from: { row: 1, column: 1 }, to: { row: 2, column: 2 } },
        { unitId: 'bravo', from: { row: 1, column: 2 }, to: { row: 2, column: 3 } },
      ],
    })

    const moved = applyCommand(document, {
      type: 'moveUnits',
      unitIds: ['alpha', 'bravo'],
      delta: { row: 1, column: 1 },
    }).document
    expect(moved.units.slice(0, 2).map((unit) => unit.position)).toEqual([
      { row: 2, column: 2 },
      { row: 2, column: 3 },
    ])
    expect(() =>
      applyCommand(document, {
        type: 'moveUnits',
        unitIds: ['alpha', 'bravo'],
        delta: { row: 3, column: 2 },
      }),
    ).toThrowError(expect.objectContaining({ code: 'CELL_OCCUPIED' }))
    expect(() =>
      applyCommand(document, {
        type: 'moveUnits',
        unitIds: ['alpha', 'bravo'],
        delta: { row: -2, column: 0 },
      }),
    ).toThrowError(expect.objectContaining({ code: 'OUT_OF_BOUNDS' }))
  })

  it('applique les actions groupées en une commande et calcule leurs actions communes', () => {
    let document = place(scenario(), 'alpha', 0, 0, 'infantry', 'rally')
    document = place(document, 'bravo', 0, 1, 'tank', 'rally')
    const selection = { kind: 'units' as const, ids: ['alpha', 'missing', 'bravo'] }
    const model = deriveSelectionModel(document, selection)

    expect(model.selectedUnits.map((unit) => unit.id)).toEqual(['alpha', 'bravo'])
    expect(model.canRallySelectedUnits).toBe(true)

    const updated = applyCommand(document, {
      type: 'updateUnits',
      unitIds: ['alpha', 'bravo'],
      changes: { factionId: 'blue', status: 'wounded' },
    }).document
    expect(updated.units.map(({ factionId, status }) => ({ factionId, status }))).toEqual([
      { factionId: 'blue', status: 'wounded' },
      { factionId: 'blue', status: 'wounded' },
    ])
    expect(() =>
      applyCommand(document, {
        type: 'updateUnits',
        unitIds: ['alpha', 'missing'],
        changes: { status: 'destroyed' },
      }),
    ).toThrowError(expect.objectContaining({ code: 'NOT_FOUND' }))
    expect(document.units.every((unit) => unit.status === 'active')).toBe(true)
  })

  it('gère annotations, redimensionnement confirmé et vidage dans le reducer', () => {
    let document = place(place(scenario(), 'inside', 0, 0), 'outside', 7, 7)
    document = applyCommand(document, {
      type: 'addAnnotation',
      annotation: {
        id: 'arrow',
        kind: 'arrow',
        start: { row: 1, column: 1 },
        end: { row: 7, column: 7 },
        color: '#ffffff',
        style: 'movement',
      },
    }).document
    document = applyCommand(document, {
      type: 'addAnnotation',
      annotation: {
        id: 'marker',
        kind: 'marker',
        position: { row: 2, column: 2 },
        color: '#fbbf24',
        markerType: 'objective',
        label: 'Pont',
      },
    }).document

    expect(previewResize(document, 5, 5)).toMatchObject({
      unitIds: ['outside'],
      annotationIds: ['arrow'],
    })
    expect(() => applyCommand(document, { type: 'resizeGrid', rows: 5, columns: 5 }))
      .toThrowError(expect.objectContaining({ code: 'RESIZE_CONFIRMATION_REQUIRED' }))

    const resized = applyCommand(document, {
      type: 'resizeGrid',
      rows: 5,
      columns: 5,
      confirmRemoval: true,
    }).document
    expect(resized.units.map((unit) => unit.id)).toEqual(['inside'])
    expect(resized.annotations.map((annotation) => annotation.id)).toEqual(['marker'])

    const cleared = applyCommand(resized, { type: 'clearBoard' }).document
    expect(cleared.units).toEqual([])
    expect(cleared.annotations).toEqual([])
    expect(cleared.factions).toBe(resized.factions)
  })

  it('conserve la cohérence des unités pendant le cycle de vie des factions', () => {
    const withCustom = applyCommand(scenario(), {
      type: 'addFaction',
      faction: { id: 'partners', name: 'Partenaires', color: '#22c55e' },
    }).document
    const populated = place(withCustom, 'alpha', 0, 0, 'infantry', 'partners')
    const edited = applyCommand(populated, {
      type: 'updateFaction',
      factionId: 'partners',
      changes: { name: 'Alliés', color: '#0ea5e9' },
    }).document
    const removed = applyCommand(edited, {
      type: 'removeFaction',
      factionId: 'partners',
      replacementFactionId: 'blue',
    }).document

    expect(withCustom.factions.at(-1)?.role).toBe('custom')
    expect(edited.units[0]?.color).toBe(populated.units[0]?.color)
    expect(removed.factions.some((faction) => faction.id === 'partners')).toBe(false)
    expect(removed.units[0]?.factionId).toBe('blue')
  })

  it('annule et rétablit une action atomique avec partage structurel et limite le passé', () => {
    const initial = place(place(scenario(), 'alpha', 1, 1), 'bravo', 1, 2)
    const applied = applyCommandToHistory(createHistory(initial), {
      type: 'moveUnits',
      unitIds: ['alpha', 'bravo'],
      delta: { row: 2, column: 2 },
    })
    const undone = undoHistory(applied.history)

    expect(applied.history.past).toEqual([initial])
    expect(undone.present).toBe(initial)
    expect(redoHistory(undone).present).toBe(applied.history.present)

    let numericHistory = createHistory(0)
    for (let value = 1; value <= 125; value += 1) {
      numericHistory = pushHistory(numericHistory, value)
    }
    expect(numericHistory.past).toHaveLength(100)
    const branched = pushHistory(undoHistory(numericHistory), 999)
    expect(branched.future).toEqual([])
  })

  it('crée une continuité vide ou reprend uniquement les forces et types nécessaires', () => {
    let source = applyCommand(scenario(), {
      type: 'addCustomUnitType',
      unitType: droneType,
    }).document
    source = place(source, 'own-drone', 1, 1, 'drone', 'blue')
    source = place(source, 'obstacle', 2, 2, 'obstacle', 'red')

    const empty = createNextScenario(source, { copyOwnForces: false, name: 'Étape 2' })
    const continued = createNextScenario(source, { copyOwnForces: true, name: 'Étape 2' })

    expect(empty).toMatchObject({ previousScenarioId: 'scenario-1', units: [] })
    expect(continued.units.map((unit) => unit.id)).not.toContain('obstacle')
    expect(continued.units.map((unit) => unit.name)).toEqual(['Drone'])
    expect(continued.customUnitTypes).toHaveLength(1)
    expect(continued.units[0]?.typeId).toBe(continued.customUnitTypes[0]?.id)
  })
})
