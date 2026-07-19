import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from './App'
import { deleteTacticalBoardDatabase } from './services'
import { useAppStore } from './store/appStore'

const BASE_PATH = '/tactical-board'
const autosaveModuleEvaluated = vi.hoisted(() => vi.fn())

vi.mock('./app/persistence/useScenarioAutosave', async (importOriginal) => {
  const original = await importOriginal<
    typeof import('./app/persistence/useScenarioAutosave')
  >()
  autosaveModuleEvaluated()
  return original
})

function waitForAutosaveWindow() {
  return new Promise((resolve) => window.setTimeout(resolve, 400))
}

function resetStore() {
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
}

beforeEach(async () => {
  cleanup()
  autosaveModuleEvaluated.mockClear()
  localStorage.clear()
  window.history.replaceState({}, '', `${BASE_PATH}/projects/tactical-board`)
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
  resetStore()
})

afterEach(async () => {
  await waitForAutosaveWindow()
  cleanup()
  vi.restoreAllMocks()
  resetStore()
  localStorage.clear()
  await deleteTacticalBoardDatabase()
})

describe('App — frontière lazy de Tactical Board', () => {
  it("n'ouvre pas IndexedDB et ne déclenche pas d'autosauvegarde hors de /board", async () => {
    const openDatabase = vi.spyOn(indexedDB, 'open')

    render(<App basename={`${BASE_PATH}/`} />)

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Cartographier une guerre intérieure.',
      }),
    ).toBeInTheDocument()

    await act(waitForAutosaveWindow)

    expect(openDatabase).not.toHaveBeenCalled()
    expect(autosaveModuleEvaluated).not.toHaveBeenCalled()
    expect(useAppStore.getState().hydrated).toBe(false)
  })

  it('charge réellement le tableau via le CTA sans conserver le shell du portfolio', async () => {
    const user = userEvent.setup()
    const openDatabase = vi.spyOn(indexedDB, 'open')

    render(<App basename={`${BASE_PATH}/`} />)
    const cta = await screen.findByRole('link', { name: 'Ouvrir Tactical Board' })
    expect(cta).toHaveAttribute('href', `${BASE_PATH}/board`)
    expect(openDatabase).not.toHaveBeenCalled()

    await user.click(cta)

    expect(window.location.pathname).toBe(`${BASE_PATH}/board`)
    expect(
      await screen.findByRole('toolbar', { name: 'Outils du plateau' }, { timeout: 10_000 }),
    ).toBeInTheDocument()
    expect(openDatabase).toHaveBeenCalled()
    expect(autosaveModuleEvaluated).toHaveBeenCalledTimes(1)
    expect(useAppStore.getState().hydrated).toBe(true)
    expect(
      screen.queryByRole('navigation', { name: 'Navigation principale' }),
    ).not.toBeInTheDocument()
    expect(document.querySelector('[data-portfolio-scroll]')).not.toBeInTheDocument()
    expect(document.title).toBe('Tactical Board — Éditeur tactique')
    expect(
      document.head.querySelector('meta[name="description"]'),
    ).toHaveAttribute(
      'content',
      'Tactical Board, éditeur de scénarios et de stratégies tactiques sur grille.',
    )
  }, 15_000)

  it("résout aussi l'accès direct à /board sous le base path", async () => {
    window.history.replaceState({}, '', `${BASE_PATH}/board`)
    const openDatabase = vi.spyOn(indexedDB, 'open')

    render(<App basename={`${BASE_PATH}/`} />)

    expect(
      await screen.findByRole('toolbar', { name: 'Outils du plateau' }, { timeout: 10_000 }),
    ).toBeInTheDocument()
    expect(openDatabase).toHaveBeenCalled()
    expect(useAppStore.getState().hydrated).toBe(true)
    expect(document.querySelector('[data-portfolio-scroll]')).not.toBeInTheDocument()
    expect(document.title).toBe('Tactical Board — Éditeur tactique')
  }, 15_000)
})
