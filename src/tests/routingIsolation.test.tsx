import { cleanup, render, screen } from '@testing-library/react'
import { useEffect } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import SiteRouter from '@/app/SiteRouter'
import type { GhostSignalCanvasProps } from '@/portfolio/webgl/GhostSignalCanvas'

const boardModuleEvaluated = vi.hoisted(() => vi.fn())
const ghostModuleEvaluated = vi.hoisted(() => vi.fn())

vi.mock('@/tactical-board/TacticalBoardApp', () => {
  boardModuleEvaluated()
  return {
    default: function TacticalBoardStub() {
      indexedDB.open('routing-isolation-board')
      return <main data-testid="board-stub"><h1>Plateau isolé</h1></main>
    },
  }
})

vi.mock('@/portfolio/webgl/GhostSignalCanvas', () => {
  ghostModuleEvaluated()
  return {
    default: function GhostSignalCanvasStub({ onReady }: GhostSignalCanvasProps) {
      useEffect(onReady, [onReady])
      return <span data-testid="ghost-stub" />
    },
  }
})

const BASE_PATH = '/tactical-board'

function installCapabilities({ reducedMotion = true, webgl2 = false } = {}) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({
      matches: query.includes('prefers-reduced-motion') && reducedMotion,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }),
  })
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((kind) => {
    if (kind !== 'webgl2' || !webgl2) return null
    return { getExtension: () => ({ loseContext: vi.fn() }) } as unknown as WebGL2RenderingContext
  })
}

const portfolioSources = import.meta.glob<string>('/src/portfolio/**/*.{ts,tsx}', {
  eager: true,
  import: 'default',
  query: '?raw',
})
const boardSources = import.meta.glob<string>('/src/tactical-board/**/*.{ts,tsx}', {
  eager: true,
  import: 'default',
  query: '?raw',
})

beforeEach(() => {
  cleanup()
  boardModuleEvaluated.mockClear()
  ghostModuleEvaluated.mockClear()
  window.history.replaceState({}, '', `${BASE_PATH}/`)
  installCapabilities()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('isolation des deux applications', () => {
  it('ne charge ni Tactical Board ni IndexedDB sur les routes du portfolio', async () => {
    const openDatabase = vi.spyOn(indexedDB, 'open').mockReturnValue({} as IDBOpenDBRequest)
    const routes = [
      ['/', 'ENTRE PLUSIEURS VIES'],
      ['/projects', 'PROJETS'],
      ['/music', 'SCÈNES SONORES'],
      ['/lab', 'FORMES EN COURS'],
      ['/about', 'ENTRE CODE, SON ET IMAGE'],
      ['/lab/tactical-board', 'TACTICAL BOARD'],
    ] as const

    for (const [route, heading] of routes) {
      window.history.replaceState({}, '', `${BASE_PATH}${route}`)
      const view = render(<SiteRouter basename={`${BASE_PATH}/`} />)
      expect(await screen.findByRole('heading', { level: 1, name: heading }))
        .toBeInTheDocument()
      view.unmount()
    }

    expect(boardModuleEvaluated).not.toHaveBeenCalled()
    expect(openDatabase).not.toHaveBeenCalled()
  })

  it('charge /board sans conserver le shell, les transitions ou le WebGL du portfolio', async () => {
    const openDatabase = vi.spyOn(indexedDB, 'open').mockReturnValue({} as IDBOpenDBRequest)
    window.history.replaceState({}, '', `${BASE_PATH}/board`)

    const { container } = render(<SiteRouter basename={`${BASE_PATH}/`} />)

    expect(await screen.findByTestId('board-stub')).toBeInTheDocument()
    expect(boardModuleEvaluated).toHaveBeenCalledOnce()
    expect(openDatabase).toHaveBeenCalledOnce()
    expect(ghostModuleEvaluated).not.toHaveBeenCalled()
    expect(screen.queryByRole('navigation', { name: 'Navigation principale' }))
      .not.toBeInTheDocument()
    expect(container.querySelector('[data-portfolio-scroll]')).not.toBeInTheDocument()
    expect(container.querySelector('[data-portfolio-page-transition]')).not.toBeInTheDocument()
  })

  it('ne charge le module Ghost Signal que sur l’accueil éligible', async () => {
    installCapabilities({ reducedMotion: false, webgl2: true })
    window.history.replaceState({}, '', `${BASE_PATH}/projects`)
    const projects = render(<SiteRouter basename={`${BASE_PATH}/`} />)
    expect(await screen.findByRole('heading', { level: 1, name: 'PROJETS' }))
      .toBeInTheDocument()
    expect(ghostModuleEvaluated).not.toHaveBeenCalled()

    projects.unmount()
    window.history.replaceState({}, '', `${BASE_PATH}/`)
    render(<SiteRouter basename={`${BASE_PATH}/`} />)
    expect(await screen.findByTestId('ghost-stub')).toBeInTheDocument()
    expect(ghostModuleEvaluated).toHaveBeenCalledOnce()
  })

  it('interdit les imports croisés et les moteurs visuels dans Tactical Board', () => {
    for (const [path, source] of Object.entries(portfolioSources)) {
      if (path.includes('.test.')) continue
      expect(source, path).not.toMatch(/(?:from\s+|import\()['"]@\/tactical-board(?:\/|['"])/)
    }

    for (const [path, source] of Object.entries(boardSources)) {
      if (path.includes('.test.')) continue
      expect(source, path).not.toMatch(/(?:from\s+|import\()['"]@\/portfolio(?:\/|['"])/)
      expect(source, path).not.toMatch(
        /(?:from\s+|import\()['"](?:three|@react-three\/fiber|@react-three\/drei|motion)(?:\/|['"])/,
      )
    }
  })
})
