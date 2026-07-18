import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { Faction, TacticalUnit, UnitType } from '../../domain'
import { InspectorPanel } from './InspectorPanel'

afterEach(cleanup)

const faction: Faction = { color: '#2563eb', id: 'blue', name: 'Bleue', role: 'own' }
const unitType: UnitType = {
  archived: false,
  builtin: true,
  category: 'Terrestre',
  defaultColor: '#94a3b8',
  icon: { kind: 'catalog', name: 'shield' },
  id: 'infantry',
  name: 'Infanterie',
}
const unit: TacticalUnit = {
  color: '#94a3b8',
  factionId: faction.id,
  icon: unitType.icon,
  id: 'unit-1',
  name: 'Alpha',
  note: '',
  position: { column: 0, row: 0 },
  status: 'active',
  typeId: unitType.id,
  typeSnapshot: {
    category: unitType.category,
    defaultColor: unitType.defaultColor,
    icon: unitType.icon,
    name: unitType.name,
    typeId: unitType.id,
  },
}

describe('InspectorPanel', () => {
  it('publie des modifications métier sans dépendre du store', async () => {
    const user = userEvent.setup()
    const onUpdateUnit = vi.fn()

    render(
      <InspectorPanel
        factions={[faction]}
        onChangeUnitType={vi.fn()}
        onDeleteUnit={vi.fn()}
        onUpdateUnit={onUpdateUnit}
        unit={unit}
        unitTypes={[unitType]}
      />,
    )

    await user.click(screen.getByRole('radio', { name: /Fragilisée/i }))
    expect(onUpdateUnit).toHaveBeenCalledWith(unit.id, { status: 'wounded' })

    const name = screen.getByLabelText('Nom individuel')
    await user.clear(name)
    await user.type(name, 'Bravo')
    await user.tab()
    expect(onUpdateUnit).toHaveBeenCalledWith(unit.id, { name: 'Bravo' })
  })

  it('reste compact et n’affiche que les actions contextuelles fournies', async () => {
    const user = userEvent.setup()
    const onRallyUnit = vi.fn()

    render(
      <InspectorPanel
        factions={[faction]}
        onChangeUnitType={vi.fn()}
        onDeleteUnit={vi.fn()}
        onRallyUnit={onRallyUnit}
        onUpdateUnit={vi.fn()}
        unit={unit}
        unitTypes={[unitType]}
      />,
    )

    expect(screen.queryByLabelText('Description courte')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Couleur de l’unité')).not.toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Neutralisée/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Neutraliser' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Rallier' }))
    expect(onRallyUnit).toHaveBeenCalledWith(unit.id)
  })

  it('conserve les flèches dans les trois styles sémantiques', async () => {
    const user = userEvent.setup()
    const onUpdateAnnotation = vi.fn()
    render(
      <InspectorPanel
        annotation={{
          color: '#ef4444',
          end: { column: 2, row: 1 },
          id: 'arrow-1',
          kind: 'arrow',
          start: { column: 0, row: 0 },
          style: 'attack',
        }}
        factions={[faction]}
        onChangeUnitType={vi.fn()}
        onDeleteUnit={vi.fn()}
        onUpdateAnnotation={onUpdateAnnotation}
        onUpdateUnit={vi.fn()}
        unitTypes={[unitType]}
      />,
    )

    expect(screen.queryByLabelText('Couleur')).not.toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('Style de flèche'), 'support')
    expect(onUpdateAnnotation).toHaveBeenCalledWith('arrow-1', {
      color: '#3b82f6',
      kind: 'arrow',
      style: 'support',
    })
  })
})
