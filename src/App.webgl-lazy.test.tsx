import { cleanup, render, screen } from '@testing-library/react'
import { useEffect } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import type { GhostSignalCanvasProps } from './portfolio/three/GhostSignalCanvas'

const ghostModuleEvaluated = vi.hoisted(() => vi.fn())

vi.mock('./portfolio/three/GhostSignalCanvas', () => {
  ghostModuleEvaluated()

  function GhostSignalCanvasStub({ onReady }: GhostSignalCanvasProps) {
    useEffect(onReady, [onReady])
    return <span data-testid="ghost-signal-stub" />
  }

  return { default: GhostSignalCanvasStub }
})
vi.mock('./TacticalBoardApp', () => ({
  default: function TacticalBoardStub() {
    return <main><h1>Plateau isolé</h1></main>
  },
}))

const BASE_PATH = '/tactical-board'

beforeEach(() => {
  cleanup()
  ghostModuleEvaluated.mockClear()
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn((query: string) => ({
      matches: query.includes('prefers-reduced-motion') ? false : false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  })
  Object.defineProperty(navigator, 'connection', { configurable: true, value: undefined })
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((contextId) => {
    if (contextId !== 'webgl2') return null
    return {
      getExtension: () => ({ loseContext: vi.fn() }),
    } as unknown as WebGL2RenderingContext
  })
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('frontière dynamique de Ghost Signal', () => {
  it.each([
    ['/projects', 'PROJETS'],
    ['/music', 'SCÈNES SONORES'],
    ['/lab', 'FORMES EN COURS'],
    ['/about', 'ENTRE CODE, SON ET IMAGE'],
  ])("n'évalue pas le module WebGL en accès direct à %s", async (route, heading) => {
    window.history.replaceState({}, '', `${BASE_PATH}${route}`)
    render(<App basename={`${BASE_PATH}/`} />)

    expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeInTheDocument()
    expect(ghostModuleEvaluated).not.toHaveBeenCalled()
  })

  it("n'évalue jamais le module WebGL sur /board", async () => {
    window.history.replaceState({}, '', `${BASE_PATH}/board`)
    render(<App basename={`${BASE_PATH}/`} />)

    expect(await screen.findByRole('heading', { name: 'Plateau isolé' })).toBeInTheDocument()
    expect(ghostModuleEvaluated).not.toHaveBeenCalled()
  })

  it("évalue le module isolé uniquement lorsque l'accueil le réclame", async () => {
    window.history.replaceState({}, '', `${BASE_PATH}/`)
    render(<App basename={`${BASE_PATH}/`} />)

    expect(await screen.findByTestId('ghost-signal-stub')).toBeInTheDocument()
    expect(ghostModuleEvaluated).toHaveBeenCalledOnce()
  })
})
