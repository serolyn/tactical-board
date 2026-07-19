import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import App from './App'

const BASE_PATH = '/tactical-board'
const INITIAL_TITLE = 'Titre initial du test'
const INITIAL_DESCRIPTION = 'Description initiale du test'

function visit(pathname: string, basename = `${BASE_PATH}/`) {
  window.history.replaceState({}, '', pathname)
  return render(<App basename={basename} />)
}

function descriptionMeta() {
  return document.head.querySelector<HTMLMetaElement>('meta[name="description"]')
}

beforeEach(() => {
  cleanup()
  window.history.replaceState({}, '', `${BASE_PATH}/`)
  document.title = INITIAL_TITLE

  const description = descriptionMeta() ?? document.createElement('meta')
  description.name = 'description'
  description.content = INITIAL_DESCRIPTION
  if (!description.isConnected) document.head.append(description)
})

afterEach(() => {
  cleanup()
  window.history.replaceState({}, '', `${BASE_PATH}/`)
})

describe('App — fondation du portfolio', () => {
  it("rend l'accueil dans le shell sémantique avec un lien d'évitement", async () => {
    visit(`${BASE_PATH}/`)

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Code, image et musique pour cartographier le chaos.',
      }),
    ).toBeInTheDocument()
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(
      screen.getByRole('navigation', { name: 'Navigation principale' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveAttribute('id', 'portfolio-main')
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Aller au contenu' }),
    ).toHaveAttribute('href', '#portfolio-main')
    expect(screen.getByRole('link', { name: 'Accueil' })).toHaveAttribute(
      'aria-current',
      'page',
    )

    await waitFor(() => {
      expect(document.title).toBe('SEROLYN — Code, image et musique')
      expect(descriptionMeta()).toHaveAttribute(
        'content',
        'Code, image et musique pour cartographier le chaos.',
      )
    })
  })

  it('indique la route active, replace la page en haut et déplace le focus après navigation', async () => {
    const user = userEvent.setup()
    const { container } = visit(`${BASE_PATH}/`)
    const homeTitle = await screen.findByRole('heading', {
      level: 1,
      name: 'Code, image et musique pour cartographier le chaos.',
    })
    await waitFor(() => expect(homeTitle).toHaveFocus())

    const scrollContainer = container.querySelector<HTMLElement>('[data-portfolio-scroll]')
    expect(scrollContainer).not.toBeNull()
    scrollContainer!.scrollTop = 160
    document.documentElement.scrollTop = 120
    document.body.scrollTop = 80

    await user.click(screen.getByRole('link', { name: 'Projets' }))

    const projectsTitle = await screen.findByRole('heading', {
      level: 1,
      name: 'Des outils pour lire le terrain autrement.',
    })
    expect(window.location.pathname).toBe(`${BASE_PATH}/projects`)
    expect(screen.getByRole('link', { name: 'Projets' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('link', { name: 'Accueil' })).not.toHaveAttribute(
      'aria-current',
    )
    await waitFor(() => {
      expect(projectsTitle).toHaveFocus()
      expect(scrollContainer).toHaveProperty('scrollTop', 0)
      expect(document.documentElement.scrollTop).toBe(0)
      expect(document.body.scrollTop).toBe(0)
      expect(document.title).toBe('Projets — SEROLYN')
    })
  })

  it('rend la présentation Tactical Board et un CTA compatible avec le base path', async () => {
    visit(`${BASE_PATH}/projects/tactical-board`)

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Cartographier une guerre intérieure.',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Une cartographie interactive où projets, obstacles, ressources et objectifs deviennent forces, fronts et trajectoires.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Ouvrir Tactical Board' }),
    ).toHaveAttribute('href', `${BASE_PATH}/board`)
    expect(screen.getByRole('link', { name: 'Projets' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await waitFor(() => {
      expect(document.title).toBe('Tactical Board — SEROLYN')
      expect(descriptionMeta()).toHaveAttribute(
        'content',
        'Une cartographie interactive où projets, obstacles, ressources et objectifs deviennent forces, fronts et trajectoires.',
      )
    })
  })

  it('résout une URL profonde avec un basename configurable', async () => {
    visit('/portfolio/lab', '/portfolio/')

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Essais, erreurs et passages ouverts.',
      }),
    ).toBeInTheDocument()
    expect(window.location.pathname).toBe('/portfolio/lab')
    expect(screen.getByRole('link', { name: 'Laboratoire' })).toHaveAttribute(
      'href',
      '/portfolio/lab',
    )
    expect(screen.getByRole('link', { name: 'Laboratoire' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('rend la page 404 dans le shell et permet de revenir sous le base path', async () => {
    visit(`${BASE_PATH}/front-inconnu`)

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Cette trajectoire ne mène nulle part.',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('Erreur 404')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Revenir à l’accueil' })).toHaveAttribute(
      'href',
      BASE_PATH,
    )
    await waitFor(() => {
      expect(document.title).toBe('Page introuvable — SEROLYN')
      expect(descriptionMeta()).toHaveAttribute(
        'content',
        "Cette trajectoire n'existe pas encore dans la cartographie de SEROLYN.",
      )
    })
  })
})
