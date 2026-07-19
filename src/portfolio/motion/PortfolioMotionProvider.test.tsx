import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { PageTransition } from './PageTransition'
import { PortfolioMotionProvider } from './PortfolioMotionProvider'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('PortfolioMotionProvider', () => {
  it('charge les fonctions DOM différées et fournit la transition de page', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      addEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches: false,
      media: query,
      onchange: null,
      removeEventListener: vi.fn(),
    }))

    render(
      <PortfolioMotionProvider>
        <PageTransition routeKey="route-test">Page prête</PageTransition>
      </PortfolioMotionProvider>,
    )

    const page = screen.getByText('Page prête')
    expect(page).toHaveAttribute('data-portfolio-page-transition')
    expect(page).toHaveAttribute('data-route-key', 'route-test')
  })
})
