import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import App from './App'
import { OBJECTIVE_CAMPAIGN_VERSION } from './data'
import { applyCommand, createDefaultScenario } from './domain'
import {
  deleteTacticalBoardDatabase,
  tacticalBoardRepository,
} from './services'
import { useAppStore } from './store/appStore'

beforeEach(async () => {
  cleanup()
  localStorage.clear()
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }),
  })
  Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
    configurable: true,
    value: () => undefined,
  })
  await deleteTacticalBoardDatabase()
  useAppStore.setState({
    documents: [],
    history: null,
    hydrated: false,
    selection: null,
    tool: 'select',
    leftPanelOpen: false,
    rightPanelOpen: false,
    notification: null,
  })
})

afterEach(async () => {
  await new Promise((resolve) => window.setTimeout(resolve, 400))
  cleanup()
  localStorage.clear()
  await deleteTacticalBoardDatabase()
})

function scenarioWithTwoUnits(factionId = 'own') {
  const scenario = createDefaultScenario('Sélection Shift', {
    blueFactionId: 'own',
    id: 'shift-scenario',
    now: '2026-07-18T12:00:00.000Z',
    redFactionId: 'obstacles',
  })
  const first = applyCommand(scenario, {
    type: 'placeUnit',
    unitId: 'alpha',
    typeId: 'infantry',
    factionId,
    position: { row: 0, column: 0 },
    name: 'Alpha',
  }).document
  return applyCommand(first, {
    type: 'placeUnit',
    unitId: 'bravo',
    typeId: 'tank',
    factionId,
    position: { row: 0, column: 1 },
    name: 'Bravo',
  }).document
}

describe('App — sélection multiple', () => {
  it('ouvre les actions au relâchement de Shift et applique un statut en une action', async () => {
    const scenario = scenarioWithTwoUnits()
    await tacticalBoardRepository.saveScenario(scenario)
    await tacticalBoardRepository.setSetting('activeScenarioId', scenario.id)
    await tacticalBoardRepository.setSetting(
      'objectiveCampaignVersion',
      OBJECTIVE_CAMPAIGN_VERSION,
    )
    const user = userEvent.setup()
    render(<App />)

    const alpha = await screen.findByRole('button', {
      name: 'Alpha, faction Mes forces, active',
    })
    const bravo = screen.getByRole('button', {
      name: 'Bravo, faction Mes forces, active',
    })

    await user.keyboard('{Shift>}')
    await user.click(alpha)
    await user.click(bravo)
    expect(
      screen.queryByRole('heading', { name: 'Actions groupées' }),
    ).not.toBeInTheDocument()

    await user.keyboard('{/Shift}')
    expect(
      await screen.findByRole('heading', { name: 'Actions groupées' }),
    ).toBeInTheDocument()
    expect(screen.getByText('2 unités sélectionnées')).toBeInTheDocument()

    await user.selectOptions(
      screen.getByLabelText('Nouveau statut commun'),
      'wounded',
    )
    await waitFor(() => {
      expect(
        screen.getByRole('button', {
          name: 'Alpha, faction Mes forces, blessée',
        }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', {
          name: 'Bravo, faction Mes forces, blessée',
        }),
      ).toBeInTheDocument()
    })
    expect(useAppStore.getState().history?.past).toHaveLength(1)

    act(() => {
      useAppStore.getState().undo()
    })
    expect(
      screen.getByRole('button', {
        name: 'Alpha, faction Mes forces, active',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: 'Bravo, faction Mes forces, active',
      }),
    ).toBeInTheDocument()
  }, 10_000)

  it('propose le ralliement seulement quand toute la sélection peut être ralliée', async () => {
    const scenario = scenarioWithTwoUnits('rally')
    await tacticalBoardRepository.saveScenario(scenario)
    await tacticalBoardRepository.setSetting('activeScenarioId', scenario.id)
    await tacticalBoardRepository.setSetting(
      'objectiveCampaignVersion',
      OBJECTIVE_CAMPAIGN_VERSION,
    )
    const user = userEvent.setup()
    render(<App />)

    const alpha = await screen.findByRole('button', {
      name: 'Alpha, faction À rallier, active',
    })
    const bravo = screen.getByRole('button', {
      name: 'Bravo, faction À rallier, active',
    })
    await user.keyboard('{Shift>}')
    await user.click(alpha)
    await user.click(bravo)
    await user.keyboard('{/Shift}')

    const rally = await screen.findByRole('button', {
      name: 'Rallier la sélection',
    })
    await user.click(rally)

    expect(
      screen.getByRole('button', {
        name: 'Alpha, faction Mes forces, active',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: 'Bravo, faction Mes forces, active',
      }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Rallier la sélection' }),
    ).not.toBeInTheDocument()
    expect(useAppStore.getState().history?.past).toHaveLength(1)
  }, 10_000)
})
