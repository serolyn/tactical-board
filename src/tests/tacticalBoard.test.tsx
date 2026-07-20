import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import TacticalBoardApp from '@/tactical-board/TacticalBoardApp'
import { applyCommand } from '@/tactical-board/model/applyScenarioCommand'
import {
  OBJECTIVE_CAMPAIGN_VERSION_SETTING,
} from '@/tactical-board/model/objectiveCampaign'
import { OBJECTIVE_CAMPAIGN_VERSION } from '@/tactical-board/model/objectiveCampaignDefinition'
import { createDefaultScenario } from '@/tactical-board/model/scenarioDocument'
import {
  deleteTacticalBoardDatabase,
  tacticalBoardRepository,
} from '@/tactical-board/persistence/tacticalBoardRepository'
import { useTacticalBoardStore } from '@/tactical-board/state/tacticalBoardStore'

function resetStore() {
  useTacticalBoardStore.setState({
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

function scenarioWithTwoUnits(factionId = 'own') {
  const source = createDefaultScenario('Bataille restaurée', {
    id: 'board-scenario',
    now: '2026-07-18T12:00:00.000Z',
    blueFactionId: 'own',
    redFactionId: 'obstacles',
  })
  const first = applyCommand(source, {
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

beforeEach(async () => {
  cleanup()
  localStorage.clear()
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({
      matches: query.includes('min-width'),
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
  resetStore()
})

afterEach(async () => {
  await new Promise((resolve) => window.setTimeout(resolve, 400))
  cleanup()
  vi.restoreAllMocks()
  resetStore()
  localStorage.clear()
  await deleteTacticalBoardDatabase()
})

describe('chargement et interactions critiques de Tactical Board', () => {
  it('hydrate une base vide avec un unique scénario initial et rend le plateau', async () => {
    render(<TacticalBoardApp />)

    await waitFor(() => {
      expect(useTacticalBoardStore.getState().hydrated).toBe(true)
      expect(useTacticalBoardStore.getState().documents).toHaveLength(1)
    })
    expect(screen.getByRole('toolbar', { name: 'Outils du plateau' })).toBeInTheDocument()
    expect(screen.getByRole('grid', { name: 'Cases du plateau' })).toBeInTheDocument()
    expect((await tacticalBoardRepository.listScenarios())).toHaveLength(1)
    await expect(
      tacticalBoardRepository.getSetting(OBJECTIVE_CAMPAIGN_VERSION_SETTING),
    ).resolves.toBe(OBJECTIVE_CAMPAIGN_VERSION)
  })

  it('restaure la bataille active, déplace une unité et conserve l’interaction en mode plateau seul', async () => {
    const document = scenarioWithTwoUnits()
    await tacticalBoardRepository.saveScenario(document)
    await tacticalBoardRepository.setSetting('activeScenarioId', document.id)
    await tacticalBoardRepository.setSetting(
      OBJECTIVE_CAMPAIGN_VERSION_SETTING,
      OBJECTIVE_CAMPAIGN_VERSION,
    )
    const user = userEvent.setup()
    const { container } = render(<TacticalBoardApp />)

    const alpha = await screen.findByRole('button', {
      name: 'Alpha, faction Mes forces, active',
    })
    expect(useTacticalBoardStore.getState().history?.present.id).toBe(document.id)
    await user.click(alpha)
    await user.click(screen.getByRole('gridcell', { name: 'Case A2, vide' }))
    await waitFor(() => {
      expect(useTacticalBoardStore.getState().history?.present.units[0]?.position).toEqual({
        row: 1,
        column: 0,
      })
    })

    await user.click(
      screen.getByRole('button', { name: 'Activer le mode plein écran du plateau' }),
    )
    expect(container.querySelector('[data-board-only]')).toHaveAttribute('data-board-only', 'true')
    expect(screen.getByRole('grid', { name: 'Cases du plateau' })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(container.querySelector('[data-board-only]')).toHaveAttribute('data-board-only', 'false')
  }, 10_000)

  it('applique statut et faction à une multi-sélection dans l’inspecteur avec undo atomique', async () => {
    const document = scenarioWithTwoUnits()
    await tacticalBoardRepository.saveScenario(document)
    await tacticalBoardRepository.setSetting('activeScenarioId', document.id)
    await tacticalBoardRepository.setSetting(
      OBJECTIVE_CAMPAIGN_VERSION_SETTING,
      OBJECTIVE_CAMPAIGN_VERSION,
    )
    const user = userEvent.setup()
    render(<TacticalBoardApp />)

    const alpha = await screen.findByRole('button', {
      name: 'Alpha, faction Mes forces, active',
    })
    const bravo = screen.getByRole('button', {
      name: 'Bravo, faction Mes forces, active',
    })
    await user.keyboard('{Shift>}')
    await user.click(alpha)
    await user.click(bravo)
    await user.keyboard('{/Shift}')

    expect(await screen.findByRole('heading', { name: 'Actions groupées' })).toBeInTheDocument()
    expect(screen.getByText('2 unités sélectionnées')).toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('Nouveau statut commun'), 'wounded')
    await user.selectOptions(screen.getByLabelText('Nouvelle faction commune'), 'obstacles')

    await waitFor(() => {
      expect(
        useTacticalBoardStore.getState().history?.present.units.map((unit) => ({
          factionId: unit.factionId,
          status: unit.status,
        })),
      ).toEqual([
        { factionId: 'obstacles', status: 'wounded' },
        { factionId: 'obstacles', status: 'wounded' },
      ])
    })
    expect(useTacticalBoardStore.getState().history?.past).toHaveLength(2)

    act(() => useTacticalBoardStore.getState().undo())
    expect(useTacticalBoardStore.getState().history?.present.units.every(
      (unit) => unit.factionId === 'own' && unit.status === 'wounded',
    )).toBe(true)
    act(() => useTacticalBoardStore.getState().undo())
    expect(useTacticalBoardStore.getState().history?.present.units.every(
      (unit) => unit.factionId === 'own' && unit.status === 'active',
    )).toBe(true)
  }, 10_000)
})
