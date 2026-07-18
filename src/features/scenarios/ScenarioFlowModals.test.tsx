import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ScenarioDetailsModal } from './ScenarioFlowModals'

afterEach(cleanup)

describe('ScenarioDetailsModal', () => {
  it('permet de définir l’objectif et la période après la création du scénario', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    render(
      <ScenarioDetailsModal
        objective=""
        onApply={onApply}
        onClose={vi.fn()}
        open
        period={{ start: '2026-09-01', current: '2026-09-01' }}
      />,
    )

    await user.type(screen.getByLabelText('Objectif court'), 'Stabiliser la nouvelle étape')
    fireEvent.change(screen.getByLabelText('Échéance'), {
      target: { value: '2027-06-30' },
    })
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }))

    expect(onApply).toHaveBeenCalledWith('Stabiliser la nouvelle étape', {
      start: '2026-09-01',
      current: '2026-09-01',
      target: '2027-06-30',
    })
  })
})
