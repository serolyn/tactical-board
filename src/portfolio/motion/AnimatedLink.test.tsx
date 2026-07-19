import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { domAnimation, LazyMotion } from 'motion/react'
import { MemoryRouter, useLocation } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AnimatedLink } from './AnimatedLink'

function LocationProbe() {
  return <output aria-label="Route active">{useLocation().pathname}</output>
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

describe('AnimatedLink', () => {
  it('n’attend aucune animation avant une navigation clavier', async () => {
    const user = userEvent.setup()

    render(
      <LazyMotion features={domAnimation}>
        <MemoryRouter initialEntries={['/']}>
          <AnimatedLink indicator="arrow" to="/projects">
            Explorer
          </AnimatedLink>
          <LocationProbe />
        </MemoryRouter>
      </LazyMotion>,
    )

    const link = screen.getByRole('link', { name: 'Explorer' })
    expect(link).toHaveAttribute('href', '/projects')
    expect(link.querySelector('[aria-hidden="true"]')).toHaveTextContent('↘')

    link.focus()
    await user.keyboard('{Enter}')

    expect(screen.getByLabelText('Route active')).toHaveTextContent('/projects')
  })
})
