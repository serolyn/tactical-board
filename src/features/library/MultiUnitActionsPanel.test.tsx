import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { applyCommand, createDefaultScenario, type TacticalUnit } from '../../domain'
import { MultiUnitActionsPanel } from './MultiUnitActionsPanel'

afterEach(cleanup)

function selectedUnits(): readonly TacticalUnit[] {
  const scenario = createDefaultScenario('Sélection groupée', {
    blueFactionId: 'blue',
    id: 'scenario-group',
    redFactionId: 'red',
  })
  const first = applyCommand(scenario, {
    factionId: 'blue',
    name: 'Alpha',
    position: { column: 0, row: 0 },
    type: 'placeUnit',
    typeId: 'infantry',
    unitId: 'alpha',
  }).document
  return applyCommand(first, {
    factionId: 'blue',
    name: 'Bravo',
    position: { column: 1, row: 0 },
    type: 'placeUnit',
    typeId: 'tank',
    unitId: 'bravo',
  }).document.units
}

describe('MultiUnitActionsPanel', () => {
  it('présente la sélection et applique un statut commun', async () => {
    const user = userEvent.setup()
    const onChangeStatus = vi.fn()
    render(
      <MultiUnitActionsPanel
        onChangeStatus={onChangeStatus}
        onClearSelection={vi.fn()}
        units={selectedUnits()}
      />,
    )

    expect(screen.getByText('2 unités sélectionnées')).toBeInTheDocument()
    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('Bravo')).toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('Nouveau statut commun'), 'wounded')

    expect(onChangeStatus).toHaveBeenCalledWith('wounded')
  })

  it('n’affiche que les actions contextuelles réellement communes', async () => {
    const user = userEvent.setup()
    const onRally = vi.fn()
    render(
      <MultiUnitActionsPanel
        onChangeStatus={vi.fn()}
        onClearSelection={vi.fn()}
        onRally={onRally}
        units={selectedUnits()}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Rallier la sélection' }))
    expect(onRally).toHaveBeenCalledOnce()
    expect(
      screen.queryByRole('button', { name: 'Neutraliser la sélection' }),
    ).not.toBeInTheDocument()
  })

  it('affiche le message demandé quand aucune action n’est commune', () => {
    render(
      <MultiUnitActionsPanel
        onClearSelection={vi.fn()}
        units={selectedUnits()}
      />,
    )

    expect(screen.getByRole('status')).toHaveTextContent(
      'Aucune action commune à effectuer',
    )
  })
})
