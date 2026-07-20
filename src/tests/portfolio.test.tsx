import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import SiteRouter from '@/app/SiteRouter'

const BASE_PATH = '/tactical-board'

function visit(pathname: string, basename = `${BASE_PATH}/`) {
  window.history.replaceState({}, '', pathname)
  return render(<SiteRouter basename={basename} />)
}

function descriptionMeta() {
  return document.head.querySelector<HTMLMetaElement>('meta[name="description"]')
}

beforeEach(() => {
  cleanup()
  window.history.replaceState({}, '', `${BASE_PATH}/`)
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }),
  })
  Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
    configurable: true,
    value: () => undefined,
  })
})

afterEach(() => {
  cleanup()
  window.history.replaceState({}, '', `${BASE_PATH}/`)
})

describe('portfolio et navigation principale', () => {
  it('rend l’accueil dans son shell avec ses liens et métadonnées', async () => {
    const { container } = visit(`${BASE_PATH}/`)

    expect(
      await screen.findByRole('heading', { level: 1, name: 'ENTRE PLUSIEURS VIES' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Navigation principale' })).toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveAttribute('id', 'portfolio-main')
    expect(screen.getByRole('link', { name: 'SEROLYN — accueil' })).toHaveAttribute(
      'href',
      BASE_PATH,
    )
    expect(screen.getByRole('link', { name: 'Explorer les projets' })).toHaveAttribute(
      'href',
      `${BASE_PATH}/projects`,
    )
    expect(screen.getByRole('link', { name: 'Découvrir TACTICAL BOARD' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Découvrir SIGNAL FANTÔME' })).toBeInTheDocument()
    expect(container.querySelector('[data-portfolio-scroll]')).toBeInTheDocument()

    await waitFor(() => {
      expect(document.title).toBe('SEROLYN — Entre plusieurs vies')
      expect(descriptionMeta()).toHaveAttribute(
        'content',
        'Code, sons et systèmes pour donner une forme à ce qui flotte.',
      )
    })
  })

  it('navigue entre les quatre rubriques avec route active, focus et scroll réinitialisé', async () => {
    const user = userEvent.setup()
    const { container } = visit(`${BASE_PATH}/`)
    const homeTitle = await screen.findByRole('heading', {
      level: 1,
      name: 'ENTRE PLUSIEURS VIES',
    })
    await waitFor(() => expect(homeTitle).toHaveFocus())

    const scrollContainer = container.querySelector<HTMLElement>('[data-portfolio-scroll]')!
    scrollContainer.scrollTop = 120

    const destinations = [
      ['Projets', 'PROJETS', '/projects'],
      ['Musique', 'SCÈNES SONORES', '/music'],
      ['Lab', 'FORMES EN COURS', '/lab'],
      ['À propos', 'ENTRE CODE, SON ET IMAGE', '/about'],
    ] as const

    for (const [linkName, heading, path] of destinations) {
      await user.click(screen.getByRole('link', { name: linkName }))
      const title = await screen.findByRole('heading', { level: 1, name: heading })
      expect(window.location.pathname).toBe(`${BASE_PATH}${path}`)
      expect(screen.getByRole('link', { name: linkName })).toHaveAttribute(
        'aria-current',
        'page',
      )
      await waitFor(() => expect(title).toHaveFocus())
      expect(scrollContainer.scrollTop).toBe(0)
    }
  })

  it('affiche les états vides sans rendre les brouillons ni un lecteur audio', async () => {
    const { unmount } = visit(`${BASE_PATH}/projects`)

    expect(await screen.findByRole('heading', { level: 1, name: 'PROJETS' }))
      .toBeInTheDocument()
    expect(screen.getByText('Les premiers systèmes sont encore en cours de documentation.'))
      .toBeInTheDocument()
    expect(screen.queryByText('PROJET À DOCUMENTER — BROUILLON NON PUBLIÉ'))
      .not.toBeInTheDocument()

    unmount()
    visit(`${BASE_PATH}/music`)
    expect(await screen.findByRole('heading', { level: 1, name: 'SCÈNES SONORES' }))
      .toBeInTheDocument()
    expect(screen.getByText('Les premières scènes seront ajoutées ici.')).toBeInTheDocument()
    expect(screen.queryByText('À TITRER — BROUILLON NON PUBLIÉ')).not.toBeInTheDocument()
    expect(document.querySelector('audio')).not.toBeInTheDocument()
  })

  it('rend les deux fiches Lab avec leurs destinations compatibles avec le base path', async () => {
    const { unmount } = visit(`${BASE_PATH}/lab/tactical-board`)

    expect(await screen.findByRole('heading', { level: 1, name: 'TACTICAL BOARD' }))
      .toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ouvrir le tableau' })).toHaveAttribute(
      'href',
      `${BASE_PATH}/board`,
    )
    expect(screen.getAllByText('Les données restent locales au navigateur.').length)
      .toBeGreaterThan(0)

    unmount()
    visit(`${BASE_PATH}/lab/signal-fantome`)
    expect(await screen.findByRole('heading', { level: 1, name: 'SIGNAL FANTÔME' }))
      .toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ouvrir la planche autonome' })).toHaveAttribute(
      'href',
      `${import.meta.env.BASE_URL}art-direction/`,
    )
    expect(
      screen.getByRole('img', {
        name: 'Planche Signal fantôme affichée dans une fenêtre desktop.',
      }),
    ).toBeInTheDocument()
  })

  it('gère redirection historique, routes inconnues et basename configurable', async () => {
    const first = visit(`${BASE_PATH}/projects/tactical-board`)
    expect(await screen.findByRole('heading', { level: 1, name: 'TACTICAL BOARD' }))
      .toBeInTheDocument()
    expect(window.location.pathname).toBe(`${BASE_PATH}/lab/tactical-board`)

    first.unmount()
    visit(`${BASE_PATH}/project-inconnu`)
    expect(await screen.findByRole('heading', { level: 1, name: 'SIGNAL INTROUVABLE' }))
      .toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Revenir à l’accueil' })).toHaveAttribute(
      'href',
      BASE_PATH,
    )

    cleanup()
    visit('/portfolio/lab', '/portfolio/')
    expect(await screen.findByRole('heading', { level: 1, name: 'FORMES EN COURS' }))
      .toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Lab' })).toHaveAttribute('href', '/portfolio/lab')
  })
})
