import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { music } from '../content'
import { MusicDetailView } from './MusicDetailPage'

describe('MusicDetailView', () => {
  it('ne rend aucun lecteur audio quand la source est absente', () => {
    const { container } = render(<MusicDetailView entry={music[0]} />)

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'À TITRER — BROUILLON NON PUBLIÉ',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('Non disponible')).toBeInTheDocument()
    expect(container.querySelector('audio')).not.toBeInTheDocument()
  })
})
