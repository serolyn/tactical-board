import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { Faction, UnitType } from '../../domain'
import { LibraryPanel } from './LibraryPanel'

const factions: Faction[] = [
  { color: '#2563eb', id: 'blue', name: 'Bleue', role: 'own' },
  { color: '#dc2626', id: 'red', name: 'Rouge', role: 'obstacle' },
]
const unitTypes: UnitType[] = [
  {
    archived: false,
    builtin: true,
    category: 'Terrestre',
    defaultColor: '#94a3b8',
    icon: { kind: 'catalog', name: 'shield' },
    id: 'infantry',
    name: 'Infanterie',
  },
]

describe('LibraryPanel', () => {
  it('délègue la faction et le type actifs au contrôleur', async () => {
    const user = userEvent.setup()
    const onSelectFaction = vi.fn()
    const onSelectUnitType = vi.fn()

    render(
      <LibraryPanel
        activeFactionId="blue"
        activeUnitTypeId={null}
        factions={factions}
        onCreateCustomType={vi.fn()}
        onCreateFaction={vi.fn()}
        onDeleteCustomType={vi.fn()}
        onDeleteFaction={vi.fn()}
        onEditCustomType={vi.fn()}
        onEditFaction={vi.fn()}
        onSelectFaction={onSelectFaction}
        onSelectUnitType={onSelectUnitType}
        unitTypes={unitTypes}
      />,
    )

    await user.click(screen.getByRole('radio', { name: 'Rouge' }))
    await user.click(screen.getByRole('radio', { name: /Infanterie, Terrestre/ }))

    expect(onSelectFaction).toHaveBeenCalledWith('red')
    expect(onSelectUnitType).toHaveBeenCalledWith('infantry')
  })
})
