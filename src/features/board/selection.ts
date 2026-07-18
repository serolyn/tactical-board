export type BoardSelection =
  | { kind: 'unit'; id: string }
  | { kind: 'units'; ids: readonly string[] }
  | { kind: 'annotation'; id: string }
  | null

export function selectedUnitIds(selection: BoardSelection): readonly string[] {
  if (selection?.kind === 'unit') return [selection.id]
  if (selection?.kind === 'units') return selection.ids
  return []
}

export function toggleUnitSelection(
  selection: BoardSelection,
  unitId: string,
): BoardSelection {
  const currentIds = selectedUnitIds(selection)
  const nextIds = currentIds.includes(unitId)
    ? currentIds.filter((id) => id !== unitId)
    : [...currentIds, unitId]
  return nextIds.length ? { kind: 'units', ids: nextIds } : null
}
