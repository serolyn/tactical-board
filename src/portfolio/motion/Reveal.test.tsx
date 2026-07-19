import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { domAnimation, LazyMotion } from 'motion/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Reveal } from './Reveal'
import { StaggerGroup, StaggerItem } from './StaggerGroup'

class TestIntersectionObserver {
  static instances: TestIntersectionObserver[] = []

  readonly disconnect = vi.fn()
  readonly observe = vi.fn()
  readonly root: Element | Document | null
  readonly rootMargin: string
  readonly thresholds: readonly number[]
  readonly unobserve = vi.fn()
  readonly takeRecords = vi.fn(() => [])
  private readonly callback: IntersectionObserverCallback

  constructor(callback: IntersectionObserverCallback, options: IntersectionObserverInit = {}) {
    this.callback = callback
    this.root = options.root ?? null
    this.rootMargin = options.rootMargin ?? '0px'
    this.thresholds = Array.isArray(options.threshold)
      ? options.threshold
      : [options.threshold ?? 0]
    TestIntersectionObserver.instances.push(this)
  }

  trigger(target: Element, isIntersecting: boolean) {
    this.callback(
      [
        {
          boundingClientRect: target.getBoundingClientRect(),
          intersectionRatio: isIntersecting ? 1 : 0,
          intersectionRect: target.getBoundingClientRect(),
          isIntersecting,
          rootBounds: null,
          target,
          time: performance.now(),
        },
      ],
      this as unknown as IntersectionObserver,
    )
  }
}

class ThrowingIntersectionObserver {
  constructor() {
    throw new Error('Observer indisponible')
  }
}

function MotionTestRoot({ children }: { children: React.ReactNode }) {
  return <LazyMotion features={domAnimation}>{children}</LazyMotion>
}

beforeEach(() => {
  TestIntersectionObserver.instances = []
  vi.stubGlobal('matchMedia', (query: string) => ({
    addEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    matches: false,
    media: query,
    onchange: null,
    removeEventListener: vi.fn(),
  }))
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('Reveal et StaggerGroup', () => {
  it("rend le contenu visible dès le premier rendu sans IntersectionObserver", () => {
    vi.stubGlobal('IntersectionObserver', undefined)

    render(
      <MotionTestRoot>
        <Reveal>Contenu éditorial</Reveal>
      </MotionTestRoot>,
    )

    expect(screen.getByText('Contenu éditorial')).toHaveAttribute(
      'data-motion-state',
      'visible',
    )
  })

  it('observe le conteneur de scroll, révèle la cible et nettoie son observer', () => {
    vi.stubGlobal('IntersectionObserver', TestIntersectionObserver)

    const { unmount } = render(
      <MotionTestRoot>
        <div data-portfolio-scroll="">
          <Reveal once={false}>Section observée</Reveal>
        </div>
      </MotionTestRoot>,
    )

    const revealed = screen.getByText('Section observée')
    const observer = TestIntersectionObserver.instances[0]
    expect(observer).toBeDefined()
    expect(observer.root).toBe(revealed.parentElement)
    expect(observer.observe).toHaveBeenCalledWith(revealed)
    expect(revealed).toHaveAttribute('data-motion-state', 'hidden')

    act(() => observer.trigger(revealed, true))
    expect(revealed).toHaveAttribute('data-motion-state', 'visible')

    unmount()
    expect(observer.disconnect).toHaveBeenCalledTimes(1)
  })

  it("revient au contenu visible si la construction de l'observer échoue", async () => {
    vi.stubGlobal('IntersectionObserver', ThrowingIntersectionObserver)

    render(
      <MotionTestRoot>
        <Reveal>Fallback propre</Reveal>
      </MotionTestRoot>,
    )

    await waitFor(() => {
      expect(screen.getByText('Fallback propre')).toHaveAttribute(
        'data-motion-state',
        'visible',
      )
    })
  })

  it("libère le contenu si un observer créé ne répond jamais", () => {
    vi.useFakeTimers()
    vi.stubGlobal('IntersectionObserver', TestIntersectionObserver)

    render(
      <MotionTestRoot>
        <Reveal>Observer silencieux</Reveal>
      </MotionTestRoot>,
    )

    const content = screen.getByText('Observer silencieux')
    expect(content).toHaveAttribute('data-motion-state', 'hidden')
    act(() => vi.advanceTimersByTime(1_200))
    expect(content).toHaveAttribute('data-motion-state', 'visible')
    expect(TestIntersectionObserver.instances[0]?.disconnect).toHaveBeenCalled()
  })

  it('conserve une structure de liste valide pour les groupes séquencés', () => {
    vi.stubGlobal('IntersectionObserver', undefined)

    render(
      <MotionTestRoot>
        <StaggerGroup as="ol" aria-label="Index">
          <StaggerItem as="li">Première entrée</StaggerItem>
          <StaggerItem as="li">Deuxième entrée</StaggerItem>
        </StaggerGroup>
      </MotionTestRoot>,
    )

    const list = screen.getByRole('list', { name: 'Index' })
    expect(list.tagName).toBe('OL')
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(list).toHaveAttribute('data-motion-state', 'visible')
  })

  it('révèle immédiatement tout contenu qui reçoit le focus clavier', () => {
    vi.stubGlobal('IntersectionObserver', TestIntersectionObserver)

    render(
      <MotionTestRoot>
        <Reveal><a href="/cible">Lien révélé</a></Reveal>
        <StaggerGroup as="ol">
          <StaggerItem as="li"><a href="/entree">Entrée révélée</a></StaggerItem>
        </StaggerGroup>
      </MotionTestRoot>,
    )

    const revealContainer = screen.getByRole('link', { name: 'Lien révélé' }).parentElement
    const staggerContainer = screen.getByRole('list')
    expect(revealContainer).toHaveAttribute('data-motion-state', 'hidden')
    expect(staggerContainer).toHaveAttribute('data-motion-state', 'hidden')

    act(() => screen.getByRole('link', { name: 'Lien révélé' }).focus())
    expect(revealContainer).toHaveAttribute('data-motion-state', 'visible')

    act(() => screen.getByRole('link', { name: 'Entrée révélée' }).focus())
    expect(staggerContainer).toHaveAttribute('data-motion-state', 'visible')
  })
})
