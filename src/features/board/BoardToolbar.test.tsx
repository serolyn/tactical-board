import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { BoardToolbar, type BoardToolbarProps } from './BoardToolbar'

afterEach(cleanup)

function toolbarProps(overrides: Partial<BoardToolbarProps> = {}): BoardToolbarProps {
  return {
    arrowColor: '#ef4444',
    arrowStyle: 'attack',
    canPlace: true,
    markerColor: '#f6ba5b',
    markerKind: 'objective',
    onArrowColorChange: vi.fn(),
    onArrowStyleChange: vi.fn(),
    onMarkerColorChange: vi.fn(),
    onMarkerKindChange: vi.fn(),
    onToolChange: vi.fn(),
    tool: 'select',
    ...overrides,
  }
}

describe('BoardToolbar', () => {
  it('désactive le placement sans type ou faction et publie les changements d’outil', async () => {
    const user = userEvent.setup()
    const props = toolbarProps({ canPlace: false })
    render(<BoardToolbar {...props} />)

    expect(screen.getByRole('button', { name: 'Placement' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Flèche' }))
    expect(props.onToolChange).toHaveBeenCalledWith('arrow')
  })

  it('expose les options contextuelles de flèche', async () => {
    const user = userEvent.setup()
    const props = toolbarProps({ tool: 'arrow' })
    render(<BoardToolbar {...props} />)

    expect(screen.getAllByRole('radio')).toHaveLength(3)
    await user.click(screen.getByRole('radio', { name: 'Route / déplacement' }))
    expect(props.onArrowStyleChange).toHaveBeenCalledWith('movement')
    expect(props.onArrowColorChange).toHaveBeenCalledWith('#f6ba5b')
  })
})
