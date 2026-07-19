import { act, cleanup, render, screen } from '@testing-library/react'
import { useRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useHeroActivity } from './useHeroActivity'

function ActivityProbe({ enabled = true }: { enabled?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const active = useHeroActivity(ref, enabled)
  return <div ref={ref} data-testid="hero">{active ? 'actif' : 'pause'}</div>
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('activité du hero', () => {
  it('reste utilisable sans IntersectionObserver', () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    render(<ActivityProbe />)
    expect(screen.getByTestId('hero')).toHaveTextContent('actif')
    vi.unstubAllGlobals()
  })

  it('suspend hors écran et nettoie observer et écouteur de visibilité', () => {
    let observerCallback: IntersectionObserverCallback = () => undefined
    const disconnect = vi.fn()
    const observe = vi.fn()
    const addVisibility = vi.spyOn(document, 'addEventListener')
    const removeVisibility = vi.spyOn(document, 'removeEventListener')

    class ObserverStub {
      constructor(callback: IntersectionObserverCallback) {
        observerCallback = callback
      }
      observe = observe
      disconnect = disconnect
      unobserve = vi.fn()
      takeRecords = () => []
      root = null
      rootMargin = ''
      thresholds = []
    }
    vi.stubGlobal('IntersectionObserver', ObserverStub)

    const { unmount } = render(<ActivityProbe />)
    expect(observe).toHaveBeenCalledOnce()

    act(() => observerCallback([
      { isIntersecting: false, intersectionRatio: 0 } as IntersectionObserverEntry,
    ], {} as IntersectionObserver))
    expect(screen.getByTestId('hero')).toHaveTextContent('pause')

    act(() => observerCallback([
      { isIntersecting: true, intersectionRatio: 1 } as IntersectionObserverEntry,
    ], {} as IntersectionObserver))
    expect(screen.getByTestId('hero')).toHaveTextContent('actif')

    unmount()
    expect(disconnect).toHaveBeenCalledOnce()
    expect(addVisibility).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
    expect(removeVisibility).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
    vi.unstubAllGlobals()
  })
})
