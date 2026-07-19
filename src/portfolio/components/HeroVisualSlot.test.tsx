import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HeroVisualSlot } from './HeroVisualSlot'
import type { GhostSignalCanvasProps } from '../three/GhostSignalCanvas'

const dynamicModuleEvaluated = vi.hoisted(() => vi.fn())
const canvasControl = vi.hoisted(() => ({ mode: 'ready' as 'ready' | 'failure' }))
const canvasCallbacks = vi.hoisted(() => ({
  renders: [] as Array<Pick<
    GhostSignalCanvasProps,
    'onFailure' | 'onReady' | 'onSignalChange' | 'onSuspended'
  >>,
}))

vi.mock('../three/GhostSignalCanvas', () => {
  dynamicModuleEvaluated()
  function GhostSignalCanvasMock(props: GhostSignalCanvasProps) {
    const { onFailure, onReady } = props
    canvasCallbacks.renders.push({
      onFailure,
      onReady,
      onSignalChange: props.onSignalChange,
      onSuspended: props.onSuspended,
    })
    useEffect(() => {
      if (canvasControl.mode === 'failure') onFailure()
      else onReady()
    }, [onFailure, onReady])
    return <span data-testid="ghost-signal-mock" />
  }

  return {
    default: GhostSignalCanvasMock,
  }
})

function setReducedMotion(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn(() => ({
      matches,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  })
}

function setWebGLAvailable(available: boolean) {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((contextId) => {
    if (contextId !== 'webgl2' || !available) return null
    return {
      getExtension: () => ({ loseContext: vi.fn() }),
    } as unknown as WebGL2RenderingContext
  })
}

beforeEach(() => {
  cleanup()
  dynamicModuleEvaluated.mockClear()
  canvasControl.mode = 'ready'
  canvasCallbacks.renders = []
  Object.defineProperty(navigator, 'connection', { configurable: true, value: undefined })
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('HeroVisualSlot progressif', () => {
  it('reste strictement statique avec reduced-motion sans évaluer le chunk Canvas', async () => {
    setReducedMotion(true)
    setWebGLAvailable(true)

    const { container } = render(<HeroVisualSlot alt="Ciel nocturne" src="/sky.webp" />)

    expect(screen.getByRole('img', { name: 'Ciel nocturne' })).toHaveAttribute('src', '/sky.webp')
    await waitFor(() => expect(container.querySelector('[data-webgl-state]')).toHaveAttribute(
      'data-webgl-state',
      'fallback',
    ))
    expect(dynamicModuleEvaluated).not.toHaveBeenCalled()
  })

  it('respecte aussi le mode économie de données avant tout import WebGL', async () => {
    setReducedMotion(false)
    setWebGLAvailable(true)
    Object.defineProperty(navigator, 'connection', {
      configurable: true,
      value: {
        saveData: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    })

    const { container } = render(<HeroVisualSlot alt="Ciel nocturne" src="/sky.webp" />)

    await waitFor(() => expect(container.querySelector('[data-webgl-state]')).toHaveAttribute(
      'data-webgl-state',
      'fallback',
    ))
    expect(dynamicModuleEvaluated).not.toHaveBeenCalled()
  })

  it('conserve le ciel seul lorsque WebGL2 est indisponible', async () => {
    setReducedMotion(false)
    setWebGLAvailable(false)

    const { container } = render(<HeroVisualSlot alt="Ciel nocturne" src="/sky.webp" />)

    await waitFor(() => expect(container.querySelector('[data-webgl-state]')).toHaveAttribute(
      'data-webgl-state',
      'fallback',
    ))
    expect(container.querySelector('canvas')).not.toBeInTheDocument()
    expect(dynamicModuleEvaluated).not.toHaveBeenCalled()
  })

  it('importe le Canvas après détection puis attend sa première frame avant le fondu', async () => {
    setReducedMotion(false)
    setWebGLAvailable(true)

    const { container } = render(<HeroVisualSlot alt="Ciel nocturne" src="/sky.webp" />)

    expect(await screen.findByTestId('ghost-signal-mock')).toBeInTheDocument()
    await waitFor(() => expect(container.querySelector('[data-webgl-state]')).toHaveAttribute(
      'data-webgl-state',
      'ready',
    ))
    expect(dynamicModuleEvaluated).toHaveBeenCalledOnce()
    expect(container.querySelector('.hero-visual-slot__future--ready')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Ciel nocturne' })).toBeInTheDocument()
  })

  it('garde les callbacks du Canvas stables pendant les rendus du signal', async () => {
    setReducedMotion(false)
    setWebGLAvailable(true)
    const onSignalChange = vi.fn()

    const { rerender } = render(
      <HeroVisualSlot alt="Ciel nocturne" onSignalChange={onSignalChange} src="/sky.webp" />,
    )

    expect(await screen.findByTestId('ghost-signal-mock')).toBeInTheDocument()
    await waitFor(() => expect(canvasCallbacks.renders.length).toBeGreaterThan(1))
    const initialCallbacks = canvasCallbacks.renders[0]
    const nextOnSignalChange = vi.fn()

    initialCallbacks.onSignalChange(true)
    rerender(
      <HeroVisualSlot alt="Ciel nocturne" onSignalChange={nextOnSignalChange} src="/sky.webp" />,
    )
    initialCallbacks.onSignalChange(false)

    for (const callbacks of canvasCallbacks.renders) {
      expect(callbacks).toEqual(initialCallbacks)
    }
    expect(onSignalChange).toHaveBeenCalledWith(true)
    expect(nextOnSignalChange).toHaveBeenCalledWith(false)
  })

  it('revient silencieusement au fallback lorsque le Canvas signale un échec', async () => {
    setReducedMotion(false)
    setWebGLAvailable(true)
    canvasControl.mode = 'failure'

    const { container } = render(<HeroVisualSlot alt="Ciel nocturne" src="/sky.webp" />)

    await waitFor(() => expect(container.querySelector('[data-webgl-state]')).toHaveAttribute(
      'data-webgl-state',
      'fallback',
    ))
    expect(screen.getByRole('img', { name: 'Ciel nocturne' })).toBeInTheDocument()
    expect(container.querySelector('.hero-visual-slot__future--ready')).not.toBeInTheDocument()
  })
})
