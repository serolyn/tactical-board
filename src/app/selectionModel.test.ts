import { describe, expect, it } from 'vitest'

import { applyCommand, createDefaultScenario, type ScenarioDocumentV1 } from '../domain'
import { deriveSelectionModel } from './selectionModel'

function placeUnit(
  scenario: ScenarioDocumentV1,
  id: string,
  factionId: string,
  row: number,
): ScenarioDocumentV1 {
  return applyCommand(scenario, {
    type: 'placeUnit',
    unitId: id,
    typeId: 'infantry',
    factionId,
    position: { row, column: 0 },
  }).document
}

describe('deriveSelectionModel', () => {
  it('renvoie un modèle vide sans scénario', () => {
    expect(deriveSelectionModel(undefined, { kind: 'unit', id: 'missing' })).toEqual({
      selectedUnit: null,
      selectedUnits: [],
      selectedAnnotation: null,
      ownFaction: undefined,
      canRallySelectedUnits: false,
      canNeutralizeSelectedUnits: false,
    })
  })

  it('résout séparément une unité simple et une annotation', () => {
    const unitScenario = placeUnit(createDefaultScenario(), 'unit-1', 'own-forces', 0)
    const scenario = {
      ...unitScenario,
      annotations: [
        {
          id: 'marker-1',
          kind: 'marker' as const,
          position: { row: 1, column: 1 },
          color: '#ffffff',
          markerType: 'objective' as const,
          label: 'Objectif',
        },
      ],
    }

    const unitModel = deriveSelectionModel(scenario, { kind: 'unit', id: 'unit-1' })
    expect(unitModel.selectedUnit?.id).toBe('unit-1')
    expect(unitModel.selectedUnits).toEqual([])

    const annotationModel = deriveSelectionModel(scenario, {
      kind: 'annotation',
      id: 'marker-1',
    })
    expect(annotationModel.selectedUnit).toBeNull()
    expect(annotationModel.selectedAnnotation).toEqual(scenario.annotations[0])
  })

  it('filtre les identifiants périmés et autorise le ralliement de plusieurs unités', () => {
    let scenario = createDefaultScenario()
    scenario = placeUnit(scenario, 'rally-1', 'rally', 0)
    scenario = placeUnit(scenario, 'rally-2', 'rally', 1)

    const model = deriveSelectionModel(scenario, {
      kind: 'units',
      ids: ['rally-2', 'missing', 'rally-1'],
    })

    expect(model.selectedUnits.map((unit) => unit.id)).toEqual(['rally-2', 'rally-1'])
    expect(model.ownFaction?.id).toBe('own-forces')
    expect(model.canRallySelectedUnits).toBe(true)
    expect(model.canNeutralizeSelectedUnits).toBe(false)
  })

  it('autorise la neutralisation commune uniquement pour des obstacles non neutralisés', () => {
    let scenario = createDefaultScenario()
    scenario = placeUnit(scenario, 'obstacle-1', 'obstacles', 0)
    scenario = placeUnit(scenario, 'obstacle-2', 'obstacles', 1)

    const selection = { kind: 'units' as const, ids: ['obstacle-1', 'obstacle-2'] }
    expect(deriveSelectionModel(scenario, selection).canNeutralizeSelectedUnits).toBe(true)

    scenario = applyCommand(scenario, {
      type: 'updateUnit',
      unitId: 'obstacle-2',
      changes: { status: 'neutralized' },
    }).document
    expect(deriveSelectionModel(scenario, selection).canNeutralizeSelectedUnits).toBe(false)
  })
})
