import { describe, expect, it, vi } from 'vitest'
import { applyCommand, createDefaultScenario, type ScenarioDocumentV1 } from '../../domain'
import { cellKey } from './boardGeometry'
import {
  calculateDragPreview,
  type DragPreviewAnchor,
} from './dragPreview'

function scenarioWithUnits(): ScenarioDocumentV1 {
  let scenario = createDefaultScenario('Drag')
  const own = scenario.factions.find((faction) => faction.role === 'own')!.id
  scenario = applyCommand(scenario, {
    type: 'placeUnit',
    unitId: 'alpha',
    typeId: 'commander',
    factionId: own,
    position: { row: 0, column: 0 },
  }).document
  scenario = applyCommand(scenario, {
    type: 'placeUnit',
    unitId: 'bravo',
    typeId: 'infantry',
    factionId: own,
    position: { row: 0, column: 1 },
  }).document
  return applyCommand(scenario, {
    type: 'placeUnit',
    unitId: 'blocker',
    typeId: 'obstacle',
    factionId: scenario.factions.find((faction) => faction.role === 'obstacle')!.id,
    position: { row: 1, column: 1 },
  }).document
}

function maps(scenario: ScenarioDocumentV1) {
  return {
    unitByCell: new Map(scenario.units.map((unit) => [cellKey(unit.position), unit])),
    unitById: new Map(scenario.units.map((unit) => [unit.id, unit])),
  }
}

const drag: DragPreviewAnchor = {
  anchorPosition: { row: 0, column: 0 },
  anchorUnitId: 'alpha',
  unitIds: ['alpha'],
  clientX: 32,
  clientY: 32,
  scrollLeft: 10,
  scrollTop: 20,
}

describe('prévisualisation pure du glissement', () => {
  it('conserve la translation du pointeur et du viewport hors du plateau', () => {
    const scenario = scenarioWithUnits()
    const preview = calculateDragPreview({
      ...maps(scenario),
      canReachObjective: vi.fn(() => false),
      clientX: 96,
      clientY: 160,
      currentScrollLeft: 30,
      currentScrollTop: 50,
      drag,
      scenario,
      target: null,
    })

    expect(preview).toMatchObject({
      translateX: 84,
      translateY: 158,
      delta: null,
      valid: false,
      changed: false,
    })
  })

  it('prévisualise un déplacement simple valide et un déplacement nul', () => {
    const scenario = scenarioWithUnits()
    const shared = {
      ...maps(scenario),
      canReachObjective: vi.fn(() => false),
      clientX: 96,
      clientY: 160,
      currentScrollLeft: 10,
      currentScrollTop: 20,
      drag,
      scenario,
    }

    expect(
      calculateDragPreview({ ...shared, target: { row: 2, column: 1 } }),
    ).toMatchObject({
      delta: { row: 2, column: 1 },
      moves: [{ unitId: 'alpha', to: { row: 2, column: 1 } }],
      valid: true,
      changed: true,
    })
    expect(
      calculateDragPreview({ ...shared, target: { row: 0, column: 0 } }),
    ).toMatchObject({ valid: true, changed: false })
  })

  it('refuse tout le groupe si une destination rencontre une unité externe', () => {
    const scenario = scenarioWithUnits()
    const preview = calculateDragPreview({
      ...maps(scenario),
      canReachObjective: vi.fn(() => false),
      clientX: 32,
      clientY: 96,
      currentScrollLeft: 10,
      currentScrollTop: 20,
      drag: { ...drag, unitIds: ['alpha', 'bravo'] },
      scenario,
      target: { row: 1, column: 0 },
    })

    expect(preview.valid).toBe(false)
    expect(preview.changed).toBe(false)
    expect(preview.moves).toHaveLength(2)
    expect(preview.message).toBe('Cette case contient déjà une unité.')
  })

  it('autorise la destination objectif spéciale pour une seule unité', () => {
    let scenario = scenarioWithUnits()
    scenario = applyCommand(scenario, {
      type: 'placeUnit',
      unitId: 'objective',
      typeId: 'objective',
      factionId: scenario.factions.find((faction) => faction.role === 'objective')!.id,
      position: { row: 2, column: 2 },
    }).document
    const canReachObjective = vi.fn(() => true)
    const preview = calculateDragPreview({
      ...maps(scenario),
      canReachObjective,
      clientX: 160,
      clientY: 160,
      currentScrollLeft: 10,
      currentScrollTop: 20,
      drag,
      scenario,
      target: { row: 2, column: 2 },
    })

    expect(preview).toMatchObject({
      objectiveTargetId: 'objective',
      valid: true,
      changed: true,
      delta: { row: 2, column: 2 },
    })
    expect(canReachObjective).toHaveBeenCalledTimes(1)
  })
})
