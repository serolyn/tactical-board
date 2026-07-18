import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import App from './App'
import {
  OBJECTIVE_CAMPAIGN_NAME,
  OBJECTIVE_CAMPAIGN_SCENARIO_ID_SETTING,
  OBJECTIVE_CAMPAIGN_VERSION,
  OBJECTIVE_CAMPAIGN_VERSION_SETTING,
} from './data'
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

function historicalCampaignV2() {
  let document = createDefaultScenario(OBJECTIVE_CAMPAIGN_NAME, {
    id: 'historical-campaign',
    now: '2026-07-18T10:00:00.000Z',
  })
  document = { ...document, grid: { ...document.grid, rows: 20, columns: 20 } }
  const ownFaction = document.factions.find((faction) => faction.role === 'own')!.id
  const rallyFaction = document.factions.find((faction) => faction.role === 'rally')!.id
  const objectiveFaction = document.factions.find((faction) => faction.role === 'objective')!.id
  document = applyCommand(document, {
    type: 'placeUnit',
    unitId: 'objective-campaign-v1-unit-walid',
    typeId: 'commander',
    factionId: ownFaction,
    position: { row: 18, column: 1 },
    name: 'Walid',
  }).document
  document = applyCommand(document, {
    type: 'placeUnit',
    unitId: 'objective-campaign-v1-unit-city-lille',
    typeId: 'fortress',
    factionId: rallyFaction,
    position: { row: 13, column: 5 },
    name: 'Lille',
  }).document
  return applyCommand(document, {
    type: 'placeUnit',
    unitId: 'objective-campaign-v1-unit-final-objective',
    typeId: 'objective',
    factionId: objectiveFaction,
    position: { row: 1, column: 18 },
    name: 'Départ en L2 stabilisé — septembre 2026',
  }).document
}

describe('App — migration de la campagne initiale', () => {
  it('amorce une base vierge avec un unique seed suivi par son identité', async () => {
    render(<App />)

    await waitFor(() => {
      expect(useAppStore.getState().hydrated).toBe(true)
      expect(useAppStore.getState().documents).toHaveLength(1)
    })

    const [campaign] = await tacticalBoardRepository.listScenarios()
    expect(campaign).toBeDefined()
    expect(campaign?.name).toBe(OBJECTIVE_CAMPAIGN_NAME)
    expect(campaign?.formatVersion).toBe(2)
    expect(campaign?.units.some((unit) => unit.name === 'LIBRE')).toBe(true)
    await expect(
      tacticalBoardRepository.getSetting(OBJECTIVE_CAMPAIGN_VERSION_SETTING),
    ).resolves.toBe(OBJECTIVE_CAMPAIGN_VERSION)
    await expect(
      tacticalBoardRepository.getSetting(OBJECTIVE_CAMPAIGN_SCENARIO_ID_SETTING),
    ).resolves.toBe(campaign?.id)
  })

  it('migre le seed V2 vers V3 sans changer son ID ni les autres scénarios', async () => {
    const legacyCampaign = {
      ...createDefaultScenario('L’objectif', {
        id: 'campaign-stable',
        now: '2026-07-18T10:00:00.000Z',
      }),
      objective: 'Ancien objectif été 2026',
      period: {
        start: '2026-07-18',
        current: '2026-07-18',
        target: '2026-09-01',
      },
    }
    const personalActive = createDefaultScenario('Projet personnel actif', {
      id: 'personal-active',
      now: '2026-07-19T10:00:00.000Z',
    })
    const personalArchived = createDefaultScenario('Archive personnelle', {
      id: 'personal-archived',
      now: '2026-06-01T10:00:00.000Z',
      status: 'archived',
    })
    await tacticalBoardRepository.saveScenario(legacyCampaign)
    await tacticalBoardRepository.saveScenario(personalActive)
    await tacticalBoardRepository.saveScenario(personalArchived)
    await tacticalBoardRepository.setSetting('activeScenarioId', personalActive.id)
    await tacticalBoardRepository.setSetting(OBJECTIVE_CAMPAIGN_VERSION_SETTING, 2)
    await tacticalBoardRepository.setSetting(
      OBJECTIVE_CAMPAIGN_SCENARIO_ID_SETTING,
      legacyCampaign.id,
    )

    render(<App />)
    await waitFor(() => {
      expect(useAppStore.getState().hydrated).toBe(true)
      expect(useAppStore.getState().documents).toHaveLength(3)
    })

    const stored = await tacticalBoardRepository.listScenarios()
    expect(stored.map((scenario) => scenario.id).sort()).toEqual([
      'campaign-stable',
      'personal-active',
      'personal-archived',
    ])
    expect(await tacticalBoardRepository.getScenario(personalActive.id)).toEqual(personalActive)
    expect(await tacticalBoardRepository.getScenario(personalArchived.id)).toEqual(
      personalArchived,
    )
    const migrated = await tacticalBoardRepository.getScenario(legacyCampaign.id)
    expect(migrated?.id).toBe(legacyCampaign.id)
    expect(migrated?.createdAt).toBe(legacyCampaign.createdAt)
    expect(migrated?.units.some((unit) => unit.name === 'LIBRE')).toBe(true)
    expect(useAppStore.getState().history?.present.id).toBe(personalActive.id)
    await expect(
      tacticalBoardRepository.getSetting(OBJECTIVE_CAMPAIGN_VERSION_SETTING),
    ).resolves.toBe(OBJECTIVE_CAMPAIGN_VERSION)
    await expect(
      tacticalBoardRepository.getSetting(OBJECTIVE_CAMPAIGN_SCENARIO_ID_SETTING),
    ).resolves.toBe(legacyCampaign.id)
  })

  it('retrouve et suit une installation V2 historique dépourvue d’ID de seed', async () => {
    const historical = historicalCampaignV2()
    const personal = createDefaultScenario('Scénario personnel', {
      id: 'personal-existing',
      now: '2026-07-19T10:00:00.000Z',
    })
    await tacticalBoardRepository.saveScenario(historical)
    await tacticalBoardRepository.saveScenario(personal)
    await tacticalBoardRepository.setSetting('activeScenarioId', personal.id)
    await tacticalBoardRepository.setSetting(OBJECTIVE_CAMPAIGN_VERSION_SETTING, 2)

    render(<App />)
    await waitFor(() => {
      expect(useAppStore.getState().hydrated).toBe(true)
      expect(useAppStore.getState().documents).toHaveLength(2)
    })

    const migrated = await tacticalBoardRepository.getScenario(historical.id)
    expect(migrated?.id).toBe(historical.id)
    expect(migrated?.units).toHaveLength(36)
    expect(migrated?.annotations).toHaveLength(12)
    expect(migrated?.units.some((unit) => unit.name === 'LIBRE')).toBe(true)
    await expect(tacticalBoardRepository.getScenario(personal.id)).resolves.toEqual(personal)
    await expect(
      tacticalBoardRepository.getSetting(OBJECTIVE_CAMPAIGN_SCENARIO_ID_SETTING),
    ).resolves.toBe(historical.id)
    await expect(
      tacticalBoardRepository.getSetting(OBJECTIVE_CAMPAIGN_VERSION_SETTING),
    ).resolves.toBe(OBJECTIVE_CAMPAIGN_VERSION)
  })

  it('respecte un seed supprimé et ne détourne aucun scénario utilisateur', async () => {
    const personal = createDefaultScenario('Nouveau scénario', {
      id: 'personal-only',
      now: '2026-07-20T10:00:00.000Z',
    })
    await tacticalBoardRepository.saveScenario(personal)
    await tacticalBoardRepository.setSetting('activeScenarioId', personal.id)
    await tacticalBoardRepository.setSetting(OBJECTIVE_CAMPAIGN_VERSION_SETTING, 2)
    await tacticalBoardRepository.setSetting(
      OBJECTIVE_CAMPAIGN_SCENARIO_ID_SETTING,
      'deleted-campaign',
    )

    render(<App />)
    await waitFor(() => {
      expect(useAppStore.getState().hydrated).toBe(true)
      expect(useAppStore.getState().documents).toHaveLength(1)
    })

    await expect(tacticalBoardRepository.listScenarios()).resolves.toEqual([personal])
    expect(useAppStore.getState().history?.present.id).toBe(personal.id)
    await expect(
      tacticalBoardRepository.getSetting(OBJECTIVE_CAMPAIGN_VERSION_SETTING),
    ).resolves.toBe(OBJECTIVE_CAMPAIGN_VERSION)
    await expect(
      tacticalBoardRepository.getSetting(OBJECTIVE_CAMPAIGN_SCENARIO_ID_SETTING),
    ).resolves.toBe('deleted-campaign')
  })
})

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
    expect(screen.getByRole('heading', { name: 'Inspecteur' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Bibliothèque' })).toBeInTheDocument()
    expect(screen.getByText('2 unités sélectionnées')).toBeInTheDocument()
    expect(useAppStore.getState().rightPanelOpen).toBe(true)
    expect(useAppStore.getState().leftPanelOpen).toBe(false)

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

  it('change la faction de toute la sélection en une seule action annulable', async () => {
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
    await user.keyboard('{/Shift}')

    await user.selectOptions(
      await screen.findByLabelText('Nouvelle faction commune'),
      'obstacles',
    )
    await waitFor(() => {
      expect(
        screen.getByRole('button', {
          name: 'Alpha, faction Obstacles, active',
        }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', {
          name: 'Bravo, faction Obstacles, active',
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

})

describe('App — mode plein écran du plateau', () => {
  it('conserve les interactions du plateau et restaure le chrome avec Échap', async () => {
    const scenario = scenarioWithTwoUnits()
    await tacticalBoardRepository.saveScenario(scenario)
    await tacticalBoardRepository.setSetting('activeScenarioId', scenario.id)
    await tacticalBoardRepository.setSetting(
      'objectiveCampaignVersion',
      OBJECTIVE_CAMPAIGN_VERSION,
    )
    const user = userEvent.setup()
    const { container } = render(<App />)

    const enterBoardOnly = await screen.findByRole('button', {
      name: 'Activer le mode plein écran du plateau',
    })
    expect(screen.getByText('Tactical Board')).toBeInTheDocument()
    expect(
      screen.getByRole('toolbar', { name: 'Outils du plateau' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Bibliothèque' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Inspecteur' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Flèche' }))
    expect(useAppStore.getState().tool).toBe('arrow')

    await user.click(enterBoardOnly)

    const app = container.querySelector<HTMLElement>('[data-board-only]')
    expect(app).toHaveAttribute('data-board-only', 'true')
    expect(useAppStore.getState().tool).toBe('select')
    expect(screen.queryByText('Tactical Board')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('toolbar', { name: 'Outils du plateau' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Bibliothèque' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Inspecteur' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('grid', { name: 'Cases du plateau' }),
    ).toBeInTheDocument()

    const alpha = screen.getByRole('button', {
      name: 'Alpha, faction Mes forces, active',
    })
    await user.click(alpha)
    expect(useAppStore.getState().selection).toEqual({ kind: 'unit', id: 'alpha' })

    await user.click(screen.getByRole('gridcell', { name: 'Case A2, vide' }))
    await waitFor(() => {
      expect(
        screen.getByRole('gridcell', { name: 'Case A2, Alpha' }),
      ).toBeInTheDocument()
    })
    expect(app).toHaveAttribute('data-board-only', 'true')
    expect(
      screen.getByRole('button', {
        name: 'Alpha, faction Mes forces, active',
      }),
    ).toHaveAttribute('aria-pressed', 'true')

    await user.keyboard('{Escape}')

    expect(app).toHaveAttribute('data-board-only', 'false')
    expect(screen.getByText('Tactical Board')).toBeInTheDocument()
    expect(
      screen.getByRole('toolbar', { name: 'Outils du plateau' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Bibliothèque' })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Propriétés de l’unité' }),
    ).toBeInTheDocument()
    expect(useAppStore.getState().selection).toEqual({ kind: 'unit', id: 'alpha' })
  }, 10_000)

  it('quitte automatiquement le mode plateau seul quand les actions groupées sont requises', async () => {
    const scenario = scenarioWithTwoUnits()
    await tacticalBoardRepository.saveScenario(scenario)
    await tacticalBoardRepository.setSetting('activeScenarioId', scenario.id)
    await tacticalBoardRepository.setSetting(
      'objectiveCampaignVersion',
      OBJECTIVE_CAMPAIGN_VERSION,
    )
    const user = userEvent.setup()
    const { container } = render(<App />)

    await user.click(
      await screen.findByRole('button', {
        name: 'Activer le mode plein écran du plateau',
      }),
    )
    const app = container.querySelector<HTMLElement>('[data-board-only]')
    expect(app).toHaveAttribute('data-board-only', 'true')

    const alpha = screen.getByRole('button', {
      name: 'Alpha, faction Mes forces, active',
    })
    const bravo = screen.getByRole('button', {
      name: 'Bravo, faction Mes forces, active',
    })
    await user.keyboard('{Shift>}')
    await user.click(alpha)
    await user.click(bravo)
    expect(app).toHaveAttribute('data-board-only', 'true')

    await user.keyboard('{/Shift}')

    await waitFor(() => {
      expect(app).toHaveAttribute('data-board-only', 'false')
    })
    expect(
      await screen.findByRole('heading', { name: 'Actions groupées' }),
    ).toBeInTheDocument()
    expect(screen.getByText('2 unités sélectionnées')).toBeInTheDocument()
  }, 10_000)
})
