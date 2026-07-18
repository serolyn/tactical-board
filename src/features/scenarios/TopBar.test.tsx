import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { TopBar, type TopBarProps } from './TopBar'

afterEach(cleanup)

function topBarProps(overrides: Partial<TopBarProps> = {}): TopBarProps {
  return {
    activeScenarioId: 'scenario-1',
    canRedo: false,
    canUndo: false,
    onCreateScenario: vi.fn(),
    onDeleteScenario: vi.fn(),
    onDuplicateScenario: vi.fn(),
    onExportJson: vi.fn(),
    onExportPng: vi.fn(),
    onForceSave: vi.fn(),
    onImportScenario: vi.fn(),
    onRedo: vi.fn(),
    onRenameScenario: vi.fn(),
    onSelectScenario: vi.fn(),
    onUndo: vi.fn(),
    saveState: 'saved',
    scenarios: [{ id: 'scenario-1', name: 'Campagne', status: 'active' }],
    ...overrides,
  }
}

async function openScenarioMenu(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Actions du scénario' }))
}

describe('TopBar', () => {
  it('publie les nouvelles actions de scénario lorsqu’elles sont disponibles', async () => {
    const user = userEvent.setup()
    const onCreateNextScenario = vi.fn()
    const onEditScenarioDetails = vi.fn()
    const onExportAllScenarios = vi.fn()
    const onSetScenarioStatus = vi.fn()

    render(
      <TopBar
        {...topBarProps({
          onCreateNextScenario,
          onEditScenarioDetails,
          onExportAllScenarios,
          onSetScenarioStatus,
        })}
      />,
    )

    await openScenarioMenu(user)
    await user.click(screen.getByRole('menuitem', { name: /Créer le suivant/i }))
    expect(onCreateNextScenario).toHaveBeenCalledWith('scenario-1')

    await openScenarioMenu(user)
    await user.click(screen.getByRole('menuitem', { name: /Objectif et période/i }))
    expect(onEditScenarioDetails).toHaveBeenCalledWith('scenario-1')

    await openScenarioMenu(user)
    await user.click(screen.getByRole('menuitem', { name: /^Archiver$/i }))
    expect(onSetScenarioStatus).toHaveBeenCalledWith('scenario-1', 'archived')

    await openScenarioMenu(user)
    await user.click(screen.getByRole('menuitem', { name: /Exporter tous les scénarios/i }))
    expect(onExportAllScenarios).toHaveBeenCalledOnce()
  })

  it('propose de désarchiver un scénario archivé', async () => {
    const user = userEvent.setup()
    const onSetScenarioStatus = vi.fn()
    render(
      <TopBar
        {...topBarProps({
          onSetScenarioStatus,
          scenarios: [{ id: 'scenario-1', name: 'Ancienne campagne', status: 'archived' }],
        })}
      />,
    )

    expect(screen.getByRole('option', { name: /archivé/i })).toBeInTheDocument()
    await openScenarioMenu(user)
    await user.click(screen.getByRole('menuitem', { name: /Désarchiver/i }))
    expect(onSetScenarioStatus).toHaveBeenCalledWith('scenario-1', 'active')
  })
})
