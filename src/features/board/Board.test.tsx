import { createRef } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  applyCommand,
  BUILT_IN_UNIT_TYPES,
  createDefaultScenario,
  type Position,
  type ScenarioDocumentV1,
} from '../../domain'
import { Board, type BoardProps } from './Board'
import type { BoardSelection } from './selection'

const infantry = BUILT_IN_UNIT_TYPES.find((type) => type.id === 'infantry')!

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

const cellSize = 64

function cellCenter(position: Position) {
  return {
    clientX: (position.column + 0.5) * cellSize,
    clientY: (position.row + 0.5) * cellSize,
  }
}

function mockGridBounds(scenario: ScenarioDocumentV1) {
  const grid = screen.getByRole('grid', { name: 'Cases du plateau' })
  const width = scenario.grid.columns * cellSize
  const height = scenario.grid.rows * cellSize
  vi.spyOn(grid, 'getBoundingClientRect').mockReturnValue({
    bottom: height,
    height,
    left: 0,
    right: width,
    top: 0,
    width,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  })
  return grid
}

function startUnitDrag(
  unit: HTMLElement,
  from: Position,
  to: Position,
  pointerId = 7,
) {
  fireEvent.pointerDown(unit, {
    ...cellCenter(from),
    button: 0,
    buttons: 1,
    isPrimary: true,
    pointerId,
    pointerType: 'mouse',
  })
  fireEvent.pointerMove(unit, {
    ...cellCenter(to),
    button: 0,
    buttons: 1,
    isPrimary: true,
    pointerId,
    pointerType: 'mouse',
  })
}

function finishUnitDrag(unit: HTMLElement, position: Position, pointerId = 7) {
  fireEvent.pointerUp(unit, {
    ...cellCenter(position),
    button: 0,
    buttons: 0,
    isPrimary: true,
    pointerId,
    pointerType: 'mouse',
  })
}

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
  onMoveUnits: ReturnType<typeof vi.fn>
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
    onMoveUnits: vi.fn(),
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
    onMoveUnits: ReturnType<typeof vi.fn>
    onPlaceUnit: ReturnType<typeof vi.fn>
    onSelectionChange: ReturnType<typeof vi.fn>
  }
}

describe('Board', () => {
  it('affiche une surface de terrain unique sous la grille interactive', () => {
    const { container } = render(<Board {...boardProps()} />)
    const board = container.querySelector('[data-board-export]')
    const cells = screen.getAllByRole('gridcell')

    expect(board).toHaveAttribute('data-board-surface', 'terrain')
    expect(cells[0]!.className).toBe(cells[1]!.className)
  })

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

  it('prévisualise une unité en transparence pendant le glissement puis valide sa destination', () => {
    const scenario = createScenarioWithUnit()
    const props = boardProps({ scenario })
    const { container } = render(<Board {...props} />)
    mockGridBounds(scenario)
    const unit = screen.getByRole('button', {
      name: `Alpha, faction ${scenario.factions[0]?.name}, active`,
    })

    startUnitDrag(unit, { column: 0, row: 0 }, { column: 1, row: 1 })

    const ghost = container.querySelector<HTMLElement>('[data-drag-ghost="unit-alpha"]')
    expect(ghost).not.toBeNull()
    expect(unit).toHaveAttribute('data-drag-source', 'true')
    expect(ghost).toHaveStyle({ transform: 'translate(64px, 64px)' })
    expect(Number.parseFloat(getComputedStyle(ghost!).opacity)).toBeLessThan(1)
    expect(screen.getByRole('gridcell', { name: 'Case B2, vide' })).toHaveAttribute(
      'data-drag-target',
      'valid',
    )

    const viewport = props.viewportRef.current
    expect(viewport).not.toBeNull()
    viewport!.scrollLeft = 32
    fireEvent.scroll(viewport!)
    expect(ghost).toHaveStyle({ transform: 'translate(96px, 64px)' })
    viewport!.scrollLeft = 0
    fireEvent.scroll(viewport!)

    finishUnitDrag(unit, { column: 1, row: 1 })

    expect(props.onMoveUnit).toHaveBeenCalledWith('unit-alpha', {
      column: 1,
      row: 1,
    })
    expect(props.onMoveUnits).not.toHaveBeenCalled()
    expect(container.querySelector('[data-drag-ghost]')).toBeNull()
  })

  it('déplace une multi-sélection en conservant sa formation', () => {
    const scenario = createScenarioWithTwoUnits()
    const selection: BoardSelection = {
      kind: 'units',
      ids: ['unit-alpha', 'unit-bravo'],
    }
    const props = boardProps({ scenario, selection })
    const { container } = render(<Board {...props} />)
    mockGridBounds(scenario)
    const alpha = screen.getByRole('button', {
      name: `Alpha, faction ${scenario.factions[0]?.name}, active`,
    })

    startUnitDrag(alpha, { column: 0, row: 0 }, { column: 0, row: 1 })

    const ghosts = container.querySelectorAll<HTMLElement>('[data-drag-ghost]')
    expect(ghosts).toHaveLength(2)
    expect(
      [...ghosts].map((ghost) => [ghost.dataset.dragGhost, ghost.style.transform]),
    ).toEqual([
      ['unit-alpha', 'translate(0px, 64px)'],
      ['unit-bravo', 'translate(0px, 64px)'],
    ])
    expect(screen.getByRole('gridcell', { name: 'Case A2, vide' })).toHaveAttribute(
      'data-drag-target',
      'valid',
    )
    expect(screen.getByRole('gridcell', { name: 'Case B2, vide' })).toHaveAttribute(
      'data-drag-target',
      'valid',
    )

    finishUnitDrag(alpha, { column: 0, row: 1 })

    expect(props.onMoveUnits).toHaveBeenCalledTimes(1)
    expect(props.onMoveUnits).toHaveBeenCalledWith(
      ['unit-alpha', 'unit-bravo'],
      { column: 0, row: 1 },
    )
    expect(props.onMoveUnit).not.toHaveBeenCalled()
  })

  it('refuse atomiquement un déplacement groupé qui rencontre une unité', () => {
    const twoUnits = createScenarioWithTwoUnits()
    const scenario = applyCommand(twoUnits, {
      factionId: 'red',
      name: 'Bloqueur',
      position: { column: 1, row: 1 },
      type: 'placeUnit',
      typeId: infantry.id,
      unitId: 'unit-blocker',
    }).document
    const selection: BoardSelection = {
      kind: 'units',
      ids: ['unit-alpha', 'unit-bravo'],
    }
    const props = boardProps({ scenario, selection })
    const { container } = render(<Board {...props} />)
    mockGridBounds(scenario)
    const alpha = screen.getByRole('button', {
      name: `Alpha, faction ${scenario.factions[0]?.name}, active`,
    })

    startUnitDrag(alpha, { column: 0, row: 0 }, { column: 0, row: 1 })

    expect(container.querySelectorAll('[data-drag-ghost]')).toHaveLength(2)
    expect(container.querySelectorAll('[data-drag-target="invalid"]')).toHaveLength(2)
    finishUnitDrag(alpha, { column: 0, row: 1 })

    expect(props.onMoveUnits).not.toHaveBeenCalled()
    expect(props.onMoveUnit).not.toHaveBeenCalled()
    expect(props.onNotify).toHaveBeenCalledWith('Cette case contient déjà une unité.')
    expect(container.querySelector('[data-drag-ghost]')).toBeNull()
  })

  it('annule le glissement sans déplacer au pointercancel', () => {
    const scenario = createScenarioWithUnit()
    const props = boardProps({ scenario })
    const { container } = render(<Board {...props} />)
    mockGridBounds(scenario)
    const unit = screen.getByRole('button', {
      name: `Alpha, faction ${scenario.factions[0]?.name}, active`,
    })

    startUnitDrag(unit, { column: 0, row: 0 }, { column: 2, row: 0 }, 19)
    expect(container.querySelector('[data-drag-ghost]')).not.toBeNull()
    fireEvent.pointerCancel(unit, {
      ...cellCenter({ column: 2, row: 0 }),
      pointerId: 19,
      pointerType: 'mouse',
    })

    expect(props.onMoveUnit).not.toHaveBeenCalled()
    expect(props.onMoveUnits).not.toHaveBeenCalled()
    expect(props.onNotify).not.toHaveBeenCalled()
    expect(container.querySelector('[data-drag-ghost]')).toBeNull()
  })

  it('libère le glissement si l’outil change avant le relâchement', () => {
    const scenario = createScenarioWithUnit()
    const props = boardProps({ scenario })
    const view = render(<Board {...props} />)
    mockGridBounds(scenario)
    const unitName = `Alpha, faction ${scenario.factions[0]?.name}, active`
    const unit = screen.getByRole('button', { name: unitName })

    startUnitDrag(unit, { column: 0, row: 0 }, { column: 1, row: 0 }, 23)
    expect(view.container.querySelector('[data-drag-ghost]')).not.toBeNull()

    view.rerender(<Board {...props} tool="marker" />)
    expect(view.container.querySelector('[data-drag-ghost]')).toBeNull()

    view.rerender(<Board {...props} tool="select" />)
    const availableUnit = screen.getByRole('button', { name: unitName })
    startUnitDrag(availableUnit, { column: 0, row: 0 }, { column: 2, row: 0 }, 24)
    finishUnitDrag(availableUnit, { column: 2, row: 0 }, 24)

    expect(props.onMoveUnit).toHaveBeenCalledWith('unit-alpha', {
      column: 2,
      row: 0,
    })
  })

  it('recouvre une unité détruite d’une grande croix rouge et l’annonce', () => {
    const placed = createScenarioWithUnit()
    const scenario = applyCommand(placed, {
      changes: { status: 'destroyed' },
      type: 'updateUnit',
      unitId: 'unit-alpha',
    }).document
    const props = boardProps({ scenario })
    const { container } = render(<Board {...props} />)

    const unit = screen.getByRole('button', {
      name: `Alpha, faction ${scenario.factions[0]?.name}, détruite`,
    })
    const overlay = unit.querySelector<HTMLElement>('[data-destroyed-overlay]')
    expect(overlay).not.toBeNull()
    expect(overlay).toHaveAttribute('aria-hidden', 'true')
    expect(overlay?.querySelector('svg')).toBeInTheDocument()
    expect(getComputedStyle(overlay!).color).toBe('rgb(255, 63, 63)')
    expect(container.querySelectorAll('[data-destroyed-overlay]')).toHaveLength(1)
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
