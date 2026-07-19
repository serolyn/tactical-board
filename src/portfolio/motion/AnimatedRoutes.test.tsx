import { render, screen, waitFor } from '@testing-library/react'
import { domAnimation, LazyMotion, MotionConfig } from 'motion/react'
import { useLayoutEffect, useRef } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AnimatedRoutes } from './AnimatedRoutes'

function TestShell() {
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 240
  }, [])

  return (
    <div data-portfolio-scroll="" data-testid="scroll-root" ref={scrollRef}>
      <AnimatedRoutes />
    </div>
  )
}

beforeEach(() => {
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
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('AnimatedRoutes', () => {
  it('réinitialise le scroll puis focalise et annonce uniquement la page entrante', async () => {
    document.title = 'Page de test'
    const disconnect = vi.spyOn(MutationObserver.prototype, 'disconnect')

    const { unmount } = render(
      <LazyMotion features={domAnimation}>
        <MotionConfig reducedMotion="user">
          <MemoryRouter initialEntries={['/']}>
            <Routes>
              <Route element={<TestShell />}>
                <Route
                  index
                  element={<h1 tabIndex={-1}>Accueil animé</h1>}
                />
              </Route>
            </Routes>
          </MemoryRouter>
        </MotionConfig>
      </LazyMotion>,
    )

    const heading = screen.getByRole('heading', { name: 'Accueil animé' })
    expect(screen.getByTestId('scroll-root').scrollTop).toBe(0)

    await waitFor(() => expect(heading).toHaveFocus(), { timeout: 1_500 })
    expect(screen.getByRole('status')).toHaveTextContent('Accueil animé')

    unmount()
    expect(disconnect).toHaveBeenCalled()
  })
})
