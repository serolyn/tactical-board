import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { UnitGlyph } from './UnitGlyph'

afterEach(cleanup)

describe('UnitGlyph', () => {
  it('utilise les images intégrées pour les bases et les obstacles', () => {
    const { rerender } = render(<UnitGlyph alt="Base" iconKey="warehouse" />)

    expect(screen.getByRole('img', { name: 'Base' })).toHaveAttribute(
      'src',
      expect.stringContaining('base-icon-game.png'),
    )

    rerender(<UnitGlyph alt="Obstacle" iconKey="triangle-alert" />)

    expect(screen.getByRole('img', { name: 'Obstacle' })).toHaveAttribute(
      'src',
      expect.stringContaining('obstacle-icon-game.png'),
    )
  })
})
