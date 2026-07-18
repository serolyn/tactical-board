import { createRef } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  applyCommand,
  BUILT_IN_UNIT_TYPES,
  createDefaultScenario,
  type ScenarioDocumentV1,
} from '../../domain'
import { Board, type BoardProps } from './Board'
import type { BoardSelection } from './selection'

const infantry = BUILT_IN_UNIT_TYPES.find((type) => type.id === 'infantry')!

afterEach(cleanup)

function createScenarioWithUnit(): ScenarioDocumentV1 {
  const scenario = createDefaultScenario('Test', {
    blueFactionId: 'blue',
    id: 'scenario-test',
    now: '2026-01-01T00:00:00.000Z',
    redFactionId: 'red',
  })
  return applyCommand(scenario, {
    factionId: 'blue',
    name: 'Alpha',
    position: { column: 0, row: 0 },
    type: 'placeUnit',
    typeId: infantry.id,
    unitId: 'unit-alpha',
  }).document
}

function createScenarioWithTwoUnits(): ScenarioDocumentV1 {
  const first = createScenarioWithUnit()
  return applyCommand(first, {
    factionId: 'blue',
    name: 'Bravo',
    position: { column: 1, row: 0 },
    type: 'placeUnit',
    typeId: infantry.id,
    unitId: 'unit-bravo',
  }).document
}

function boardProps(
  overrides: Partial<BoardProps> = {},
): BoardProps & {
  onAddArrow: ReturnType<typeof vi.fn>
  onDeleteAnnotation: ReturnType<typeof vi.fn>
  onDeleteUnit: ReturnType<typeof vi.fn>
  onMoveUnit: ReturnType<typeof vi.fn>
  onPlaceUnit: ReturnType<typeof vi.fn>
  onSelectionChange: ReturnType<typeof vi.fn>
} {
  const scenario = overrides.scenario ?? createDefaultScenario('Test', {
    blueFactionId: 'blue',
    id: 'scenario-test',
    now: '2026-01-01T00:00:00.000Z',
    redFactionId: 'red',
  })
  return {
    arrowColor: '#ef4444',
    arrowStyle: 'attack',
    assetUrls: {},
    markerColor: '#f6ba5b',
    markerKind: 'objective',
    onAddArrow: vi.fn(),
    onAddMarker: vi.fn(),
    onDeleteAnnotation: vi.fn(),
    onDeleteUnit: vi.fn(),
    onMoveUnit: vi.fn(),
    onNotify: vi.fn(),
    onPlaceUnit: vi.fn(),
    onSelectionChange: vi.fn(),
    placementFaction: scenario.factions[0] ?? null,
    placementType: infantry,
    scenario,
    selection: null,
    tool: 'select',
    viewportRef: createRef<HTMLDivElement>(),
    zoom: 1,
    ...overrides,
  } as BoardProps & {
    onAddArrow: ReturnType<typeof vi.fn>
    onDeleteAnnotation: ReturnType<typeof vi.fn>
    onDeleteUnit: ReturnType<typeof vi.fn>
    onMoveUnit: ReturnType<typeof vi.fn>
    onPlaceUnit: ReturnType<typeof vi.fn>
    onSelectionChange: ReturnType<typeof vi.fn>
  }
}

describe('Board', () => {
  it('place répétitivement le type et la faction actifs par clic', async () => {
    const user = userEvent.setup()
    const props = boardProps({ tool: 'place' })
    render(<Board {...props} />)

    await user.click(screen.getByRole('gridcell', { name: 'Case B1, vide' }))
    await user.click(screen.getByRole('gridcell', { name: 'Case C1, vide' }))

    expect(props.onPlaceUnit).toHaveBeenNthCalledWith(
      1,
      infantry,
      props.scenario.factions[0],
      { column: 1, row: 0 },
    )
    expect(props.onPlaceUnit).toHaveBeenNthCalledWith(
      2,
      infantry,
      props.scenario.factions[0],
      { column: 2, row: 0 },
    )
  })

  it('déplace une unité en la sélectionnant puis en choisissant une case', async () => {
    const user = userEvent.setup()
    const scenario = createScenarioWithUnit()
    const props = boardProps({ scenario })
    const view = render(<Board {...props} />)
    const unitName = `Alpha, faction ${scenario.factions[0]?.name}, active`

    await user.click(
      screen.getByRole('button', { name: unitName }),
    )
    expect(
      screen
        .getByRole('button', { name: unitName })
        .closest('[aria-hidden="true"]'),
    ).toBeNull()
    const selection: BoardSelection = { id: 'unit-alpha', kind: 'unit' }
    expect(props.onSelectionChange).toHaveBeenCalledWith(selection)

    view.rerender(<Board {...props} selection={selection} />)
    await user.click(screen.getByRole('gridcell', { name: 'Case B1, vide' }))

    expect(props.onMoveUnit).toHaveBeenCalledWith('unit-alpha', {
      column: 1,
      row: 0,
    })
  })

  it('accumule et retire des unités avec Shift sans déplacer le groupe', () => {
    const scenario = createScenarioWithTwoUnits()
    const props = boardProps({ scenario })
    const view = render(<Board {...props} />)
    const alpha = screen.getByRole('button', {
      name: `Alpha, faction ${scenario.factions[0]?.name}, active`,
    })
    const bravo = screen.getByRole('button', {
      name: `Bravo, faction ${scenario.factions[0]?.name}, active`,
    })

    fireEvent.click(alpha, { shiftKey: true })
    expect(props.onSelectionChange).toHaveBeenLastCalledWith({
      kind: 'units',
      ids: ['unit-alpha'],
    })

    const firstSelection: BoardSelection = { kind: 'units', ids: ['unit-alpha'] }
    view.rerender(<Board {...props} selection={firstSelection} />)
    fireEvent.click(bravo, { shiftKey: true })
    expect(props.onSelectionChange).toHaveBeenLastCalledWith({
      kind: 'units',
      ids: ['unit-alpha', 'unit-bravo'],
    })

    const groupSelection: BoardSelection = {
      kind: 'units',
      ids: ['unit-alpha', 'unit-bravo'],
    }
    view.rerender(<Board {...props} selection={groupSelection} />)
    expect(alpha).toHaveAttribute('aria-pressed', 'true')
    expect(bravo).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(screen.getByRole('gridcell', { name: 'Case C1, vide' }), {
      shiftKey: true,
    })
    expect(props.onMoveUnit).not.toHaveBeenCalled()

    fireEvent.click(alpha, { shiftKey: true })
    expect(props.onSelectionChange).toHaveBeenLastCalledWith({
      kind: 'units',
      ids: ['unit-bravo'],
    })
  })

  it('crée une flèche en deux clics avec le style actif', async () => {
    const user = userEvent.setup()
    const props = boardProps({
      arrowColor: '#22c55e',
      arrowStyle: 'support',
      tool: 'arrow',
    })
    render(<Board {...props} />)

    await user.click(screen.getByRole('gridcell', { name: 'Case A1, vide' }))
    await user.click(screen.getByRole('gridcell', { name: 'Case C2, vide' }))

    expect(props.onAddArrow).toHaveBeenCalledWith(
      { column: 0, row: 0 },
      { column: 2, row: 1 },
      'support',
      '#22c55e',
    )
  })

  it('efface une annotation trouvée sur la case', async () => {
    const user = userEvent.setup()
    const base = createDefaultScenario('Test', {
      blueFactionId: 'blue',
      id: 'scenario-test',
      now: '2026-01-01T00:00:00.000Z',
      redFactionId: 'red',
    })
    const scenario = applyCommand(base, {
      annotation: {
        color: '#eab308',
        id: 'marker-1',
        kind: 'marker',
        label: 'Objectif',
        markerType: 'objective',
        position: { column: 1, row: 1 },
      },
      type: 'addAnnotation',
    }).document
    const props = boardProps({ scenario, tool: 'erase' })
    render(<Board {...props} />)

    await user.click(screen.getByRole('gridcell', { name: 'Case B2, vide' }))

    expect(props.onDeleteAnnotation).toHaveBeenCalledWith('marker-1')
  })

  it('navigue dans la grille avec les flèches du clavier', async () => {
    const user = userEvent.setup()
    const props = boardProps()
    render(<Board {...props} />)
    const first = screen.getByRole('gridcell', { name: 'Case A1, vide' })
    const secondRow = screen.getByRole('gridcell', { name: 'Case B2, vide' })

    first.focus()
    await user.keyboard('{ArrowRight}{ArrowDown}')

    expect(secondRow).toHaveFocus()
  })

  it('permet au commandant sélectionné d’atteindre une unité objectif dorée', async () => {
    const user = userEvent.setup()
    const base = createDefaultScenario('Test')
    const commander = applyCommand(base, {
      type: 'placeUnit',
      unitId: 'commander-one',
      typeId: 'commander',
      factionId: base.factions.find((faction) => faction.role === 'own')!.id,
      position: { row: 0, column: 0 },
      name: 'Commandant',
    }).document
    const scenario = applyCommand(commander, {
      type: 'placeUnit',
      unitId: 'objective-one',
      typeId: 'objective',
      factionId: base.factions.find((faction) => faction.role === 'objective')!.id,
      position: { row: 0, column: 1 },
      name: 'Objectif final',
    }).document
    const onReachObjective = vi.fn()
    const props = boardProps({
      scenario,
      selection: { kind: 'unit', id: 'commander-one' },
      onReachObjective,
    })
    render(<Board {...props} />)

    const objectiveButton = screen.getByRole('button', {
      name: 'Objectif final, faction Objectifs, active',
    })
    expect(objectiveButton).toHaveAttribute('data-cell', '0:1')
    expect(objectiveButton).toHaveAttribute('data-row', '0')
    expect(objectiveButton).toHaveAttribute('data-column', '1')
    await user.click(objectiveButton)

    expect(onReachObjective).toHaveBeenCalledWith('commander-one', 'objective-one')
  })

  it('ajoute un objectif à la sélection avec Shift sans le déclencher', () => {
    const base = createDefaultScenario('Test')
    const commander = applyCommand(base, {
      type: 'placeUnit',
      unitId: 'commander-one',
      typeId: 'commander',
      factionId: base.factions.find((faction) => faction.role === 'own')!.id,
      position: { row: 0, column: 0 },
      name: 'Commandant',
    }).document
    const scenario = applyCommand(commander, {
      type: 'placeUnit',
      unitId: 'objective-one',
      typeId: 'objective',
      factionId: base.factions.find((faction) => faction.role === 'objective')!.id,
      position: { row: 0, column: 1 },
      name: 'Objectif final',
    }).document
    const onReachObjective = vi.fn()
    const props = boardProps({
      scenario,
      selection: { kind: 'unit', id: 'commander-one' },
      onReachObjective,
    })
    render(<Board {...props} />)

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Objectif final, faction Objectifs, active',
      }),
      { shiftKey: true },
    )

    expect(onReachObjective).not.toHaveBeenCalled()
    expect(props.onSelectionChange).toHaveBeenCalledWith({
      kind: 'units',
      ids: ['commander-one', 'objective-one'],
    })
  })
})
