import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { NewScenarioModal } from './NewScenarioModal'

afterEach(cleanup)

describe('NewScenarioModal', () => {
  it('transmet l’objectif et la période facultative avec les dimensions', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn()
    render(<NewScenarioModal onClose={vi.fn()} onCreate={onCreate} open />)

    const name = screen.getByLabelText('Nom du scénario')
    await user.clear(name)
    await user.type(name, 'Étape suivante')
    await user.type(screen.getByLabelText(/Objectif/i), 'Atteindre une position stable')
    fireEvent.change(screen.getByLabelText('Début'), { target: { value: '2026-09-01' } })
    fireEvent.change(screen.getByLabelText('Échéance'), { target: { value: '2027-06-30' } })

    await user.click(screen.getByRole('button', { name: 'Créer' }))

    expect(onCreate).toHaveBeenCalledWith('Étape suivante', 20, 20, {
      objective: 'Atteindre une position stable',
      period: { start: '2026-09-01', target: '2027-06-30' },
    })
  })

  it('conserve les métadonnées facultatives', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn()
    render(<NewScenarioModal onClose={vi.fn()} onCreate={onCreate} open />)

    await user.click(screen.getByRole('button', { name: 'Créer' }))
    expect(onCreate).toHaveBeenCalledWith('Nouveau scénario', 20, 20, {
      objective: undefined,
      period: undefined,
    })
  })
})
