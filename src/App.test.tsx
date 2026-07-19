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

describe('App — portfolio éditorial', () => {
  it("rend l'accueil réel dans le shell avec les contenus publiés uniquement", async () => {
    const { container } = visit(`${BASE_PATH}/`)

    expect(
      screen.getByRole('heading', { level: 1, name: 'ENTRE PLUSIEURS VIES' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Code, sons et systèmes pour donner une forme à ce qui flotte.'))
      .toBeInTheDocument()
    expect(container.querySelector('.portfolio-header')).toBeInTheDocument()
    expect(
      screen.getByRole('navigation', { name: 'Navigation principale' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveAttribute('id', 'portfolio-main')
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Aller au contenu' })).toHaveAttribute(
      'href',
      '#portfolio-main',
    )
    expect(screen.getByRole('link', { name: 'SEROLYN — accueil' })).toHaveAttribute(
      'href',
      BASE_PATH,
    )
    expect(screen.getByRole('link', { name: 'Explorer les projets' })).toHaveAttribute(
      'href',
      `${BASE_PATH}/projects`,
    )
    expect(screen.getByRole('link', { name: /Écouter les scènes/ })).toHaveAttribute(
      'href',
      `${BASE_PATH}/music`,
    )

    expect(screen.getByRole('link', { name: 'Découvrir TACTICAL BOARD' }))
      .toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Découvrir SIGNAL FANTÔME' }))
      .toBeInTheDocument()
    expect(screen.queryByText('PROJET À DOCUMENTER — BROUILLON NON PUBLIÉ'))
      .not.toBeInTheDocument()
    expect(screen.queryByText('À TITRER — BROUILLON NON PUBLIÉ')).not.toBeInTheDocument()
    expect(
      screen.getByText('Les premiers systèmes sont encore en cours de documentation.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Les premières scènes seront ajoutées ici.')).toBeInTheDocument()

    await waitFor(() => {
      expect(document.title).toBe('SEROLYN — Entre plusieurs vies')
      expect(descriptionMeta()).toHaveAttribute(
        'content',
        'Code, sons et systèmes pour donner une forme à ce qui flotte.',
      )
    })
  })

  it('navigue entre toutes les rubriques, indique la route active et replace le focus', async () => {
    const user = userEvent.setup()
    const { container } = visit(`${BASE_PATH}/`)
    const homeTitle = screen.getByRole('heading', {
      level: 1,
      name: 'ENTRE PLUSIEURS VIES',
    })
    await waitFor(() => expect(homeTitle).toHaveFocus())

    const scrollContainer = container.querySelector<HTMLElement>('[data-portfolio-scroll]')
    expect(scrollContainer).not.toBeNull()
    scrollContainer!.scrollTop = 160
    document.documentElement.scrollTop = 120
    document.body.scrollTop = 80

    await user.click(screen.getByRole('link', { name: 'Projets' }))
    const projectsTitle = await screen.findByRole('heading', { level: 1, name: 'PROJETS' })
    expect(window.location.pathname).toBe(`${BASE_PATH}/projects`)
    expect(screen.getByRole('link', { name: 'Projets' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await waitFor(() => {
      expect(projectsTitle).toHaveFocus()
      expect(scrollContainer).toHaveProperty('scrollTop', 0)
      expect(document.documentElement.scrollTop).toBe(0)
      expect(document.body.scrollTop).toBe(0)
      expect(document.title).toBe('Projets — SEROLYN')
    })

    await user.click(screen.getByRole('link', { name: 'Musique' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'SCÈNES SONORES' }))
      .toBeInTheDocument()
    expect(window.location.pathname).toBe(`${BASE_PATH}/music`)
    expect(screen.getByRole('link', { name: 'Musique' })).toHaveAttribute(
      'aria-current',
      'page',
    )

    await user.click(screen.getByRole('link', { name: 'Lab' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'FORMES EN COURS' }))
      .toBeInTheDocument()
    expect(window.location.pathname).toBe(`${BASE_PATH}/lab`)
    expect(screen.getByRole('link', { name: 'Lab' })).toHaveAttribute('aria-current', 'page')

    await user.click(screen.getByRole('link', { name: 'À propos' }))
    expect(
      await screen.findByRole('heading', { level: 1, name: 'ENTRE CODE, SON ET IMAGE' }),
    ).toBeInTheDocument()
    expect(window.location.pathname).toBe(`${BASE_PATH}/about`)
    expect(screen.getByRole('link', { name: 'À propos' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('affiche les états vides exacts de Projets et Musique sans publier les brouillons', async () => {
    const { unmount } = visit(`${BASE_PATH}/projects`)

    expect(await screen.findByRole('heading', { level: 1, name: 'PROJETS' }))
      .toBeInTheDocument()
    expect(
      screen.getByText('Les premiers systèmes sont encore en cours de documentation.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('PROJET À DOCUMENTER — BROUILLON NON PUBLIÉ'))
      .not.toBeInTheDocument()

    unmount()
    visit(`${BASE_PATH}/music`)

    expect(await screen.findByRole('heading', { level: 1, name: 'SCÈNES SONORES' }))
      .toBeInTheDocument()
    expect(screen.getByText('Chaque morceau est un lieu émotionnel à habiter.'))
      .toBeInTheDocument()
    expect(screen.getByText('Les premières scènes seront ajoutées ici.')).toBeInTheDocument()
    expect(screen.queryByText('À TITRER — BROUILLON NON PUBLIÉ')).not.toBeInTheDocument()
    expect(document.querySelector('audio')).not.toBeInTheDocument()
  })

  it('publie exactement les deux entrées Lab', async () => {
    visit(`${BASE_PATH}/lab`)

    expect(await screen.findByRole('heading', { level: 1, name: 'FORMES EN COURS' }))
      .toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Découvrir TACTICAL BOARD' })).toHaveAttribute(
      'href',
      `${BASE_PATH}/lab/tactical-board`,
    )
    expect(screen.getByRole('link', { name: 'Découvrir SIGNAL FANTÔME' })).toHaveAttribute(
      'href',
      `${BASE_PATH}/lab/signal-fantome`,
    )
    expect(document.querySelectorAll('.entry-index > li')).toHaveLength(2)
  })

  it('rend Tactical Board avec son CTA base-path-safe et son avertissement local', async () => {
    visit(`${BASE_PATH}/lab/tactical-board`)

    const title = await screen.findByRole('heading', { level: 1, name: 'TACTICAL BOARD' })
    expect(title).toBeInTheDocument()
    await waitFor(() => expect(title).toHaveFocus())
    expect(screen.getByText('Cartographier une guerre intérieure.')).toBeInTheDocument()
    expect(
      screen.getAllByText(
        'Un système interactif où projets, obstacles, ressources et objectifs deviennent forces, fronts et trajectoires.',
      ),
    ).toHaveLength(2)
    expect(screen.getByRole('link', { name: 'Ouvrir le tableau' })).toHaveAttribute(
      'href',
      `${BASE_PATH}/board`,
    )
    expect(screen.getAllByText('Les données restent locales au navigateur.').length)
      .toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: 'Lab' })).toHaveAttribute('aria-current', 'page')

    await waitFor(() => {
      expect(document.title).toBe('Tactical Board — Lab SEROLYN')
      expect(descriptionMeta()).toHaveAttribute(
        'content',
        'Un système interactif où projets, obstacles, ressources et objectifs deviennent forces, fronts et trajectoires.',
      )
    })
  })

  it('redirige sans doublon l’ancienne URL Tactical Board vers le Lab', async () => {
    visit(`${BASE_PATH}/projects/tactical-board`)

    expect(
      await screen.findByRole('heading', { level: 1, name: 'TACTICAL BOARD' }),
    ).toBeInTheDocument()
    expect(window.location.pathname).toBe(`${BASE_PATH}/lab/tactical-board`)
    expect(screen.getByRole('link', { name: 'Lab' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  it('rend Signal fantôme avec sa planche et ses captures statiques base-path-safe', async () => {
    visit(`${BASE_PATH}/lab/signal-fantome`)

    expect(
      await screen.findByRole('heading', { level: 1, name: 'SIGNAL FANTÔME' }),
    ).toBeInTheDocument()
    expect(
      screen.getAllByText(
        'Une direction visuelle nocturne située entre archive personnelle, morceau ambient et système numérique.',
      ),
    ).toHaveLength(2)
    const staticBasePath = import.meta.env.BASE_URL.endsWith('/')
      ? import.meta.env.BASE_URL
      : `${import.meta.env.BASE_URL}/`
    expect(screen.getByRole('link', { name: 'Ouvrir la planche autonome' })).toHaveAttribute(
      'href',
      `${staticBasePath}art-direction/`,
    )
    expect(
      screen.getByRole('img', {
        name: 'Planche Signal fantôme affichée dans une fenêtre desktop.',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('img', {
        name: 'Planche Signal fantôme affichée dans une fenêtre mobile.',
      }),
    ).toBeInTheDocument()

    await waitFor(() => {
      expect(document.title).toBe('Signal fantôme — Lab SEROLYN')
    })
  })

  it('garde les brouillons et les slugs inconnus hors des pages de détail publiques', async () => {
    const { unmount } = visit(`${BASE_PATH}/projects/project-template`)

    expect(await screen.findByRole('heading', { level: 1, name: 'ENTRÉE INTROUVABLE' }))
      .toBeInTheDocument()
    expect(screen.queryByText('PROJET À DOCUMENTER — BROUILLON NON PUBLIÉ'))
      .not.toBeInTheDocument()

    unmount()
    visit(`${BASE_PATH}/music/music-template`)
    expect(await screen.findByRole('heading', { level: 1, name: 'ENTRÉE INTROUVABLE' }))
      .toBeInTheDocument()
    expect(screen.queryByText('À TITRER — BROUILLON NON PUBLIÉ')).not.toBeInTheDocument()

    cleanup()
    visit(`${BASE_PATH}/lab/signal-inconnu`)
    expect(await screen.findByRole('heading', { level: 1, name: 'ENTRÉE INTROUVABLE' }))
      .toBeInTheDocument()
  })

  it('affiche le contenu À propos exact et masque les liens optionnels non renseignés', async () => {
    visit(`${BASE_PATH}/about`)

    expect(
      await screen.findByRole('heading', { level: 1, name: 'ENTRE CODE, SON ET IMAGE' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Je construis des systèmes, des scènes sonores et des formes visuelles pour donner une structure à ce qui reste difficile à nommer. SEROLYN rassemble ces expériences au même endroit.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Approche' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'En ce moment' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Technologies' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Contact' })).not.toBeInTheDocument()
    expect(document.querySelector('.optional-links')).not.toBeInTheDocument()
  })

  it('résout une URL profonde avec un basename configurable', async () => {
    visit('/portfolio/lab', '/portfolio/')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'FORMES EN COURS' }),
    ).toBeInTheDocument()
    expect(window.location.pathname).toBe('/portfolio/lab')
    expect(screen.getByRole('link', { name: 'Lab' })).toHaveAttribute('href', '/portfolio/lab')
    expect(screen.getByRole('link', { name: 'Lab' })).toHaveAttribute('aria-current', 'page')
  })

  it('rend la page 404 générique dans le shell et revient sous le base path', async () => {
    visit(`${BASE_PATH}/front-inconnu`)

    expect(
      await screen.findByRole('heading', { level: 1, name: 'SIGNAL INTROUVABLE' }),
    ).toBeInTheDocument()
    expect(screen.getByText('ERREUR / 404')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Revenir à l’accueil' })).toHaveAttribute(
      'href',
      BASE_PATH,
    )
    await waitFor(() => {
      expect(document.title).toBe('Page introuvable — SEROLYN')
      expect(descriptionMeta()).toHaveAttribute(
        'content',
        'Cette entrée est introuvable, non publiée ou encore en cours de documentation.',
      )
    })
  })
})
