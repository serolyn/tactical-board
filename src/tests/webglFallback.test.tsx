/**
 * @packageDocumentation
 * Tests automatiques du projet.
 *
 * Ce fichier vérifie un comportement précis pour éviter les régressions.
 * Quand tu modifies le code associé, lis ce test pour comprendre ce qui doit
 * rester vrai.
 */

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { HeroVisualSlot } from '@/portfolio/components/PortfolioHeroVisualSlot'
import type { GhostSignalCanvasProps } from '@/portfolio/webgl/GhostSignalCanvas'
import { evaluatePerformanceWindow } from '@/portfolio/webgl/ghostSignalQualityProfile'
import { bindWebGLContextLifecycle } from '@/portfolio/webgl/webglContextLifecycle'

const dynamicModuleEvaluated = vi.hoisted(() => vi.fn())
const canvasMode = vi.hoisted(() => ({ value: 'ready' as 'ready' | 'failure' }))

vi.mock('@/portfolio/webgl/GhostSignalCanvas', () => {
  dynamicModuleEvaluated()
  return {
    default: function GhostSignalCanvasMock({
      onDiagnostics,
      onFailure,
      onReady,
    }: GhostSignalCanvasProps) {
      useEffect(() => {
        onDiagnostics({ fps: 58.4, profile: 'high' })
        if (canvasMode.value === 'failure') onFailure('shader-error')
        else onReady()
      }, [onDiagnostics, onFailure, onReady])
      return <span data-testid="ghost-canvas" />
    },
  }
})
/**
 * Cette fonction intervient sur le sujet “install Motion Preference” dans tests.
 *
 * Fichier: src/tests/webglFallback.test.tsx
 * Si tu lis ce fichier pour apprendre, regarde d’abord installMotionPreference dans webglFallback.test.tsx.
 */


function installMotionPreference(reduced: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn(() => ({
      matches: reduced,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  })
}
/**
 * Cette fonction intervient sur le sujet “install Web GL” dans tests.
 *
 * Fichier: src/tests/webglFallback.test.tsx
 * Si tu lis ce fichier pour apprendre, regarde d’abord installWebGL dans webglFallback.test.tsx.
 */


function installWebGL(available: boolean, throws = false) {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((kind) => {
    if (throws) throw new Error('Contexte indisponible')
    if (kind !== 'webgl2' || !available) return null
    return { getExtension: () => ({ loseContext: vi.fn() }) } as unknown as WebGL2RenderingContext
  })
}

beforeEach(() => {
  cleanup()
  dynamicModuleEvaluated.mockClear()
  canvasMode.value = 'ready'
  Object.defineProperty(navigator, 'connection', { configurable: true, value: undefined })
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('fallback progressif de Ghost Signal', () => {
  it('garde Ghost Signal actif même si Firefox annonce un mouvement réduit', async () => {
    installMotionPreference(true)
    installWebGL(true)

    const { container } = render(<HeroVisualSlot alt="Ciel nocturne" src="/sky.webp" />)

    expect(await screen.findByTestId('ghost-canvas')).toBeInTheDocument()
    const slot = container.querySelector('[data-webgl-state]')
    await waitFor(() => expect(slot).toHaveAttribute('data-webgl-state', 'ready'))
    expect(slot).toHaveAttribute('data-webgl-fallback-cause', 'none')
    expect(slot).toHaveAttribute('data-webgl-reduced-motion', 'true')
    expect(slot).toHaveAttribute('data-webgl2', 'true')
  })

  it('utilise le fallback exact quand WebGL2 est absent ou sa création échoue', async () => {
    installMotionPreference(false)
    installWebGL(false)
    const first = render(<HeroVisualSlot alt="Premier ciel" src="/first.webp" />)
    await waitFor(() => expect(first.container.querySelector('[data-webgl-state]'))
      .toHaveAttribute('data-webgl-fallback-cause', 'webgl2-unavailable'))
    expect(dynamicModuleEvaluated).not.toHaveBeenCalled()

    first.unmount()
    vi.restoreAllMocks()
    installMotionPreference(false)
    installWebGL(false, true)
    const second = render(<HeroVisualSlot alt="Second ciel" src="/second.webp" />)
    await waitFor(() => expect(second.container.querySelector('[data-webgl-state]'))
      .toHaveAttribute('data-webgl-fallback-cause', 'webgl2-unavailable'))
    expect(screen.getByRole('img', { name: 'Second ciel' })).toBeInTheDocument()
  })

  it('active le Canvas après la première frame et garde save-data informatif', async () => {
    installMotionPreference(false)
    installWebGL(true)
    Object.defineProperty(navigator, 'connection', {
      configurable: true,
      value: {
        saveData: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    })

    const { container } = render(<HeroVisualSlot alt="Ciel nocturne" src="/sky.webp" />)

    expect(await screen.findByTestId('ghost-canvas')).toBeInTheDocument()
    const slot = container.querySelector('[data-webgl-state]')
    await waitFor(() => expect(slot).toHaveAttribute('data-webgl-state', 'ready'))
    expect(slot).toHaveAttribute('data-webgl-fallback-cause', 'none')
    expect(slot).toHaveAttribute('data-webgl-save-data', 'true')
    expect(slot).toHaveAttribute('data-webgl-profile', 'high')
    expect(slot).toHaveAttribute('data-webgl-fps', '58.4')
    expect(container.querySelector('.hero-visual-slot__future--ready')).toBeInTheDocument()
  })

  it('revient à l’image statique quand le Canvas signale une erreur technique', async () => {
    installMotionPreference(false)
    installWebGL(true)
    canvasMode.value = 'failure'

    const { container } = render(<HeroVisualSlot alt="Ciel nocturne" src="/sky.webp" />)
    const slot = container.querySelector('[data-webgl-state]')

    await waitFor(() => expect(slot).toHaveAttribute('data-webgl-state', 'fallback'))
    expect(slot).toHaveAttribute('data-webgl-fallback-cause', 'shader-error')
    expect(screen.getByRole('img', { name: 'Ciel nocturne' })).toBeInTheDocument()
    expect(container.querySelector('.hero-visual-slot__future--ready')).not.toBeInTheDocument()
  })

  it('restaure un contexte bref et ne bascule pour les FPS qu’après quatre fenêtres basses', () => {
    vi.useFakeTimers()
    const canvas = document.createElement('canvas')
    const callbacks = {
      onLost: vi.fn(),
      onRestored: vi.fn(),
      onPermanentFailure: vi.fn(),
    }
    const release = bindWebGLContextLifecycle(canvas, callbacks, 2_000)

    canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }))
    vi.advanceTimersByTime(1_000)
    canvas.dispatchEvent(new Event('webglcontextrestored'))
    vi.advanceTimersByTime(2_000)
    expect(callbacks.onLost).toHaveBeenCalledOnce()
    expect(callbacks.onRestored).toHaveBeenCalledOnce()
    expect(callbacks.onPermanentFailure).not.toHaveBeenCalled()
    release()

    let state = { action: 'none' as const, declineWindows: 0, fallbackWindows: 0 }
    for (let index = 0; index < 3; index += 1) {
      const decision = evaluatePerformanceWindow('low', 23, state)
      expect(decision.action).toBe('none')
      state = { ...decision, action: 'none' }
    }
    expect(evaluatePerformanceWindow('low', 23, state).action).toBe('fallback')
    expect(evaluatePerformanceWindow('low', 24, state).fallbackWindows).toBe(0)

  })
})
