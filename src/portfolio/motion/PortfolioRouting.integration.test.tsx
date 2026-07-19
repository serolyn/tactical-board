import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { FocusEventHandler } from 'react'
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from '../../App'
import { AnimatedLink } from './AnimatedLink'
import { AnimatedRoutes } from './AnimatedRoutes'
import { PortfolioMotionProvider } from './PortfolioMotionProvider'

vi.mock('../../TacticalBoardApp', () => ({
  default: function TacticalBoardStub() {
    return <main data-testid="board-stub">Plateau tactique isolé</main>
  },
}))

const BASE_PATH = '/tactical-board'

interface MatchMediaOptions {
  reducedMotion?: boolean
}

function installQueryAwareMatchMedia({ reducedMotion = false }: MatchMediaOptions = {}) {
  const matchMedia = vi.fn((query: string): MediaQueryList => {
    const listeners = new Set<(event: MediaQueryListEvent) => void>()
    const matches = query.includes('prefers-reduced-motion') && reducedMotion

    return {
      addEventListener: vi.fn((_type, listener) => {
        if (typeof listener === 'function') listeners.add(listener)
      }),
      addListener: vi.fn((listener) => listeners.add(listener)),
      dispatchEvent: vi.fn(() => true),
      matches,
      media: query,
      onchange: null,
      removeEventListener: vi.fn((_type, listener) => {
        if (typeof listener === 'function') listeners.delete(listener)
      }),
      removeListener: vi.fn((listener) => listeners.delete(listener)),
    } as MediaQueryList
  })

  vi.stubGlobal('matchMedia', matchMedia)

  return matchMedia
}

function LocationProbe() {
  return <output aria-label="Route courante">{useLocation().pathname}</output>
}

function routeAnnouncement() {
  const announcement = document.querySelector<HTMLElement>('[data-route-announcement]')
  if (!announcement) throw new Error("La région d’annonce des routes est absente.")
  return announcement
}

function TestMotionShell() {
  const navigate = useNavigate()

  return (
    <PortfolioMotionProvider>
      <div data-portfolio-scroll="" data-testid="portfolio-scroll-root">
        <header data-testid="persistent-shell-header">
          <AnimatedLink to="/alpha">Alpha</AnimatedLink>
          <AnimatedLink to="/beta">Beta</AnimatedLink>
          <button onClick={() => navigate(-1)} type="button">
            Retour navigateur
          </button>
          <LocationProbe />
        </header>
        <main>
          <AnimatedRoutes announcementClassName="route-announcement-test" />
        </main>
      </div>
    </PortfolioMotionProvider>
  )
}

interface TestPageProps {
  name: string
  onFocus?: FocusEventHandler<HTMLHeadingElement>
}

function TestPage({ name, onFocus }: TestPageProps) {
  return (
    <article>
      <h1 onFocus={onFocus} tabIndex={-1}>{name}</h1>
      <p>Contenu {name}</p>
    </article>
  )
}

interface ControlledRouterProps {
  alphaFocus?: FocusEventHandler<HTMLHeadingElement>
  betaFocus?: FocusEventHandler<HTMLHeadingElement>
  initialEntries?: string[]
  initialIndex?: number
}

function ControlledRouter({
  alphaFocus,
  betaFocus,
  initialEntries = ['/alpha'],
  initialIndex,
}: ControlledRouterProps) {
  return (
    <MemoryRouter initialEntries={initialEntries} initialIndex={initialIndex}>
      <Routes>
        <Route element={<TestMotionShell />}>
          <Route path="/alpha" element={<TestPage name="Page Alpha" onFocus={alphaFocus} />} />
          <Route path="/beta" element={<TestPage name="Page Beta" onFocus={betaFocus} />} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  cleanup()
  // Motion conserve cette préférence au niveau du module : le premier rendu de
  // ce fichier l'initialise donc dans le mode accessible que nous voulons tester.
  installQueryAwareMatchMedia({ reducedMotion: true })
  window.history.replaceState({}, '', `${BASE_PATH}/projects`)
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  window.history.replaceState({}, '', `${BASE_PATH}/`)
})

describe('intégration des routes animées du portfolio', () => {
  it('conserve le shell, attend la sortie puis focalise et annonce uniquement le h1 entrant', async () => {
    const alphaFocus = vi.fn()
    const betaFocus = vi.fn()
    const { container } = render(
      <ControlledRouter alphaFocus={alphaFocus} betaFocus={betaFocus} />,
    )

    const alphaHeading = screen.getByRole('heading', { name: 'Page Alpha' })
    await waitFor(() => expect(alphaHeading).toHaveFocus(), { timeout: 1_500 })
    expect(routeAnnouncement()).toHaveTextContent('Page Alpha')

    const persistentHeader = screen.getByTestId('persistent-shell-header')
    const outgoingFrame = container.querySelector('[data-portfolio-page-transition]')
    const scrollRoot = screen.getByTestId('portfolio-scroll-root')
    scrollRoot.scrollTop = 317
    document.documentElement.scrollTop = 211
    document.body.scrollTop = 109
    alphaFocus.mockClear()
    betaFocus.mockClear()

    fireEvent.click(screen.getByRole('link', { name: 'Beta' }))

    // Le routeur change immédiatement, pendant que la page sortante termine sa sortie.
    expect(screen.getByLabelText('Route courante')).toHaveTextContent('/beta')
    expect(screen.getByRole('heading', { name: 'Page Alpha' })).toBeInTheDocument()
    expect(container.querySelector('[data-portfolio-page-transition]')).toBe(outgoingFrame)

    const betaHeading = await screen.findByRole(
      'heading',
      { name: 'Page Beta' },
      { timeout: 2_000 },
    )

    await waitFor(() => {
      expect(betaHeading).toHaveFocus()
      expect(routeAnnouncement()).toHaveTextContent('Page Beta')
      expect(scrollRoot.scrollTop).toBe(0)
      expect(document.documentElement.scrollTop).toBe(0)
      expect(document.body.scrollTop).toBe(0)
    }, { timeout: 1_500 })

    expect(screen.queryByRole('heading', { name: 'Page Alpha' })).not.toBeInTheDocument()
    expect(screen.getByTestId('persistent-shell-header')).toBe(persistentHeader)
    expect(alphaFocus).not.toHaveBeenCalled()
    expect(betaFocus).toHaveBeenCalledTimes(1)
    expect(routeAnnouncement()).toHaveAttribute('aria-live', 'polite')
    expect(routeAnnouncement()).toHaveAttribute('aria-atomic', 'true')
    expect(container.querySelectorAll('[data-portfolio-page-transition]')).toHaveLength(1)
  })

  it('préserve le retour de l’historique du navigateur dans l’application réelle', async () => {
    const user = userEvent.setup()

    render(<App basename={`${BASE_PATH}/`} />)

    const projectsHeading = await screen.findByRole('heading', {
      level: 1,
      name: 'PROJETS',
    })
    await waitFor(() => expect(projectsHeading).toHaveFocus(), { timeout: 1_500 })

    await user.click(screen.getByRole('link', { name: 'À propos' }))
    const aboutHeading = await screen.findByRole(
      'heading',
      { level: 1, name: 'ENTRE CODE, SON ET IMAGE' },
      { timeout: 2_000 },
    )
    await waitFor(() => expect(aboutHeading).toHaveFocus(), { timeout: 1_500 })
    expect(window.location.pathname).toBe(`${BASE_PATH}/about`)

    act(() => window.history.back())

    const restoredHeading = await screen.findByRole(
      'heading',
      { level: 1, name: 'PROJETS' },
      { timeout: 2_000 },
    )
    await waitFor(() => {
      expect(window.location.pathname).toBe(`${BASE_PATH}/projects`)
      expect(restoredHeading).toHaveFocus()
      expect(routeAnnouncement()).toHaveTextContent('PROJETS')
    }, { timeout: 1_500 })
  })

  it('laisse les liens immédiatement navigables lorsque le mouvement est réduit', async () => {
    render(<ControlledRouter />)

    const alphaHeading = screen.getByRole('heading', { name: 'Page Alpha' })
    await waitFor(() => expect(alphaHeading).toHaveFocus(), { timeout: 1_500 })

    fireEvent.click(screen.getByRole('link', { name: 'Beta' }))

    // La destination est validée dans le même tour d’événement, sans attendre le fondu.
    expect(screen.getByLabelText('Route courante')).toHaveTextContent('/beta')
    expect(screen.getByRole('heading', { name: 'Page Alpha' })).toBeInTheDocument()
    const outgoingFrame = document.querySelector<HTMLElement>(
      '[data-portfolio-page-transition]',
    )
    expect(outgoingFrame?.style.filter).toBe('')
    expect(outgoingFrame?.style.transform).toBe('')

    const betaHeading = await screen.findByRole(
      'heading',
      { name: 'Page Beta' },
      { timeout: 1_500 },
    )
    await waitFor(() => expect(betaHeading).toHaveFocus(), { timeout: 1_000 })
  })

  it('ne monte ni le shell ni son cadre Motion sur la route /board', async () => {
    window.history.replaceState({}, '', `${BASE_PATH}/board`)

    const { container } = render(<App basename={`${BASE_PATH}/`} />)

    expect(await screen.findByTestId('board-stub')).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Navigation principale' }))
      .not.toBeInTheDocument()
    expect(container.querySelector('[data-portfolio-scroll]')).not.toBeInTheDocument()
    expect(container.querySelector('[data-portfolio-page-transition]')).not.toBeInTheDocument()
    expect(container.querySelector('[data-route-announcement]')).not.toBeInTheDocument()
  })
})
