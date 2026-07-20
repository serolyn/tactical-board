/**
 * @packageDocumentation
 * Tests automatiques du projet.
 *
 * Ce fichier vérifie un comportement précis pour éviter les régressions.
 * Quand tu modifies le code associé, lis ce test pour comprendre ce qui doit
 * rester vrai.
 */

import { cleanup, fireEvent, render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ScreenGlitch } from '@/app/effects/ScreenGlitch'

let reducedMotion = false
let visibilityState: DocumentVisibilityState = 'visible'
let initialMatchMediaDescriptor: PropertyDescriptor | undefined
let initialRootStyle = ''
/**
 * Cette fonction intervient sur le sujet “restore Property” dans tests.
 *
 * Fichier: src/tests/screenGlitch.test.tsx
 * Si tu lis ce fichier pour apprendre, regarde d’abord restoreProperty dans screenGlitch.test.tsx.
 */


function restoreProperty(
  target: object,
  property: PropertyKey,
  descriptor: PropertyDescriptor | undefined,
) {
  if (descriptor) Object.defineProperty(target, property, descriptor)
  else Reflect.deleteProperty(target, property)
}
/**
 * Cette fonction intervient sur le sujet “install Environment Mocks” dans tests.
 *
 * Fichier: src/tests/screenGlitch.test.tsx
 * Si tu lis ce fichier pour apprendre, regarde d’abord installEnvironmentMocks dans screenGlitch.test.tsx.
 */


function installEnvironmentMocks() {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn((query: string) => ({
      matches: reducedMotion,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(() => true),
    })),
  })

  vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibilityState)
}
/**
 * Cette fonction intervient sur le sujet “screen Glitch Tree” dans tests.
 *
 * Fichier: src/tests/screenGlitch.test.tsx
 * Si tu lis ce fichier pour apprendre, regarde d’abord screenGlitchTree dans screenGlitch.test.tsx.
 */


function screenGlitchTree(enabled = true) {
  return (
    <MemoryRouter initialEntries={['/']}>
      <ScreenGlitch enabled={enabled} />
    </MemoryRouter>
  )
}
/**
 * Cette fonction intervient sur le sujet “render Screen Glitch” dans tests.
 *
 * Fichier: src/tests/screenGlitch.test.tsx
 * Si tu lis ce fichier pour apprendre, regarde d’abord renderScreenGlitch dans screenGlitch.test.tsx.
 */


function renderScreenGlitch(enabled = true) {
  return render(screenGlitchTree(enabled))
}

beforeEach(() => {
  vi.useFakeTimers()
  reducedMotion = false
  visibilityState = 'visible'
  initialMatchMediaDescriptor = Object.getOwnPropertyDescriptor(window, 'matchMedia')
  initialRootStyle = document.documentElement.style.cssText
  installEnvironmentMocks()
})

afterEach(() => {
  cleanup()
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.restoreAllMocks()
  restoreProperty(window, 'matchMedia', initialMatchMediaDescriptor)
  document.documentElement.style.cssText = initialRootStyle
})

describe('glitch global de l’écran', () => {
  it('ne monte ni ne planifie le glitch lorsqu’il est désactivé', () => {
    const view = renderScreenGlitch(false)

    expect(document.querySelector('.screen-glitch')).toBeNull()
    expect(vi.getTimerCount()).toBe(0)

    fireEvent.keyDown(document, { key: 'g' })
    expect(vi.getTimerCount()).toBe(0)

    view.unmount()
  })

  it('ne planifie rien avec reduced-motion ou un onglet masqué', () => {
    const blockedEnvironments = [
      { hidden: false, reduced: true },
      { hidden: true, reduced: false },
    ]

    for (const environment of blockedEnvironments) {
      reducedMotion = environment.reduced
      visibilityState = environment.hidden ? 'hidden' : 'visible'
      const view = renderScreenGlitch()

      expect(vi.getTimerCount()).toBe(0)

      view.unmount()
    }
  })

  it('retire et remonte le glitch lorsque enabled change', () => {
    const view = renderScreenGlitch()

    expect(document.querySelector('.screen-glitch')).toBeInTheDocument()

    view.rerender(screenGlitchTree(false))

    expect(vi.getTimerCount()).toBe(0)
    expect(document.querySelector('.screen-glitch')).toBeNull()

    view.rerender(screenGlitchTree(true))

    expect(document.querySelector('.screen-glitch')).toBeInTheDocument()
  })
})
