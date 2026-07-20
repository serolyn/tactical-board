/** Applique chaque mutation métier de façon pure et atomique sur un scénario. */
import { produce } from 'immer'
import { findUnitType } from './unitCatalog'
import {
  MAX_GRID_SIZE,
  MIN_GRID_SIZE,
  type AnnotationChanges,
  type BoardAnnotation,
  type CommandEffects,
  type CommandResult,
  type CustomUnitType,
  type DomainErrorCode,
  type Faction,
  type IconRef,
  type MoveUnitsPreview,
  type Position,
  type ResizeImpact,
  type ScenarioCommand,
  type ScenarioDocumentV1,
  type ScenarioPeriod,
  type TacticalUnit,
  type UnitType,
  type UnitTypeSnapshot,
} from './tacticalBoardTypes'

const NO_EFFECTS: CommandEffects = Object.freeze({
  removedUnitIds: Object.freeze([]),
  removedAnnotationIds: Object.freeze([]),
})

export class DomainError extends Error {
  readonly code: DomainErrorCode
  readonly details?: Readonly<Record<string, unknown>>

  constructor(
    code: DomainErrorCode,
    message: string,
    details?: Readonly<Record<string, unknown>>,
  ) {
    super(message)
    this.name = 'DomainError'
    this.code = code
    this.details = details
  }
}

function fail(
  code: DomainErrorCode,
  message: string,
  details?: Readonly<Record<string, unknown>>,
): never {
  throw new DomainError(code, message, details)
}

function samePosition(left: Position, right: Position): boolean {
  return left.row === right.row && left.column === right.column
}

function sameIcon(left: IconRef, right: IconRef): boolean {
  return left.kind === right.kind &&
    (left.kind === 'catalog'
      ? left.name === (right as typeof left).name
      : left.assetId === (right as typeof left).assetId)
}

function copyIcon(icon: IconRef): IconRef {
  return icon.kind === 'catalog'
    ? { kind: 'catalog', name: icon.name }
    : { kind: 'asset', assetId: icon.assetId }
}

function snapshotType(unitType: UnitType): UnitTypeSnapshot {
  return {
    typeId: unitType.id,
    name: unitType.name,
    category: unitType.category,
    defaultColor: unitType.defaultColor,
    icon: copyIcon(unitType.icon),
  }
}

function isInside(position: Position, rows: number, columns: number): boolean {
  return (
    Number.isInteger(position.row) &&
    Number.isInteger(position.column) &&
    position.row >= 0 &&
    position.row < rows &&
    position.column >= 0 &&
    position.column < columns
  )
}

function assertGridSize(rows: number, columns: number): void {
  if (
    !Number.isInteger(rows) ||
    !Number.isInteger(columns) ||
    rows < MIN_GRID_SIZE ||
    rows > MAX_GRID_SIZE ||
    columns < MIN_GRID_SIZE ||
    columns > MAX_GRID_SIZE
  ) {
    fail(
      'INVALID_GRID_SIZE',
      `La grille doit mesurer entre ${MIN_GRID_SIZE} et ${MAX_GRID_SIZE} cases.`,
      { rows, columns },
    )
  }
}

function assertInside(document: ScenarioDocumentV1, position: Position): void {
  if (!isInside(position, document.grid.rows, document.grid.columns)) {
    fail('OUT_OF_BOUNDS', 'Cette position se trouve hors du plateau.', { position })
  }
}

function assertPositionInside(
  document: ScenarioDocumentV1,
  annotation: BoardAnnotation,
): void {
  if (annotation.kind === 'arrow') {
    assertInside(document, annotation.start)
    assertInside(document, annotation.end)
  } else {
    assertInside(document, annotation.position)
  }
}

function requireFaction(document: ScenarioDocumentV1, factionId: string): Faction {
  const faction = document.factions.find((candidate) => candidate.id === factionId)
  if (!faction) {
    fail('INVALID_REFERENCE', 'La faction demandée est introuvable.', { factionId })
  }
  return faction
}

function requireAvailableType(document: ScenarioDocumentV1, typeId: string): UnitType {
  const unitType = findUnitType(typeId, document.customUnitTypes)
  if (!unitType || unitType.archived) {
    fail('INVALID_REFERENCE', "Le type d'unité demandé est introuvable ou archivé.", { typeId })
  }
  return unitType
}

function changedDocument(
  document: ScenarioDocumentV1,
  command: ScenarioCommand,
  changes: Partial<ScenarioDocumentV1>,
): ScenarioDocumentV1 {
  return produce(document, (draft) => {
    Object.assign(draft, changes)
    draft.updatedAt = command.at ?? document.updatedAt
  })
}

function samePeriod(left: ScenarioPeriod | undefined, right: ScenarioPeriod | undefined): boolean {
  return (
    left?.start === right?.start &&
    left?.target === right?.target &&
    left?.current === right?.current
  )
}

function updateScenarioMetadata(
  document: ScenarioDocumentV1,
  command: Extract<ScenarioCommand, { type: 'updateScenarioMetadata' }>,
): CommandResult {
  const hasChanges = Object.entries(command.changes).some(([key, value]) => {
    if (key === 'period') return !samePeriod(document.period, value as ScenarioPeriod | undefined)
    return document[key as keyof ScenarioDocumentV1] !== value
  })
  if (!hasChanges) return result(document, document)

  const changes: Partial<ScenarioDocumentV1> =
    command.changes.period === undefined
      ? { ...command.changes }
      : { ...command.changes, period: { ...command.changes.period } }
  return result(document, changedDocument(document, command, changes))
}

function updateScenarioProgress(
  document: ScenarioDocumentV1,
  command: Extract<ScenarioCommand, { type: 'updateScenarioProgress' }>,
): CommandResult {
  if (document.period?.current === command.current) return result(document, document)

  const period: ScenarioPeriod = {
    ...(document.period?.start === undefined ? {} : { start: document.period.start }),
    ...(document.period?.target === undefined ? {} : { target: document.period.target }),
    ...(command.current === undefined ? {} : { current: command.current }),
  }
  const nextPeriod = Object.keys(period).length === 0 ? undefined : period
  return result(document, changedDocument(document, command, { period: nextPeriod }))
}

function result(
  original: ScenarioDocumentV1,
  document: ScenarioDocumentV1,
  effects: CommandEffects = NO_EFFECTS,
): CommandResult {
  return { document, changed: document !== original, effects }
}

function updateAt<T>(
  items: readonly T[],
  index: number,
  updater: (current: T) => T,
): readonly T[] {
  const current = items[index]
  if (current === undefined) return items
  const next = updater(current)
  if (next === current) return items
  return [...items.slice(0, index), next, ...items.slice(index + 1)]
}

function isAnnotationOutside(
  annotation: BoardAnnotation,
  rows: number,
  columns: number,
): boolean {
  return annotation.kind === 'arrow'
    ? !isInside(annotation.start, rows, columns) || !isInside(annotation.end, rows, columns)
    : !isInside(annotation.position, rows, columns)
}

export function previewResize(
  document: ScenarioDocumentV1,
  rows: number,
  columns: number,
): ResizeImpact {
  assertGridSize(rows, columns)
  const unitIds = document.units
    .filter((unit) => !isInside(unit.position, rows, columns))
    .map((unit) => unit.id)
  const annotationIds = document.annotations
    .filter((annotation) => isAnnotationOutside(annotation, rows, columns))
    .map((annotation) => annotation.id)

  return {
    unitIds,
    annotationIds,
    unitCount: unitIds.length,
    annotationCount: annotationIds.length,
  }
}

function applyResize(
  document: ScenarioDocumentV1,
  command: Extract<ScenarioCommand, { type: 'resizeGrid' }>,
): CommandResult {
  assertGridSize(command.rows, command.columns)
  if (document.grid.rows === command.rows && document.grid.columns === command.columns) {
    return result(document, document)
  }

  const impact = previewResize(document, command.rows, command.columns)
  if ((impact.unitCount > 0 || impact.annotationCount > 0) && !command.confirmRemoval) {
    fail(
      'RESIZE_CONFIRMATION_REQUIRED',
      `Ce redimensionnement retirera ${impact.unitCount} unité(s) et ${impact.annotationCount} annotation(s).`,
      { impact },
    )
  }

  const removedUnits = new Set(impact.unitIds)
  const removedAnnotations = new Set(impact.annotationIds)
  const next = changedDocument(document, command, {
    grid: { ...document.grid, rows: command.rows, columns: command.columns },
    units:
      impact.unitCount === 0
        ? document.units
        : document.units.filter((unit) => !removedUnits.has(unit.id)),
    annotations:
      impact.annotationCount === 0
        ? document.annotations
        : document.annotations.filter((annotation) => !removedAnnotations.has(annotation.id)),
  })
  return result(document, next, {
    removedUnitIds: impact.unitIds,
    removedAnnotationIds: impact.annotationIds,
  })
}

function placeUnit(
  document: ScenarioDocumentV1,
  command: Extract<ScenarioCommand, { type: 'placeUnit' }>,
): CommandResult {
  if (document.units.some((unit) => unit.id === command.unitId)) {
    fail('DUPLICATE_ID', "Cet identifiant d'unité existe déjà.", { unitId: command.unitId })
  }
  assertInside(document, command.position)
  if (document.units.some((unit) => samePosition(unit.position, command.position))) {
    fail('CELL_OCCUPIED', 'Cette case contient déjà une unité.', { position: command.position })
  }
  requireFaction(document, command.factionId)
  const unitType = requireAvailableType(document, command.typeId)
  const unit: TacticalUnit = {
    id: command.unitId,
    name: command.name ?? unitType.name,
    typeId: unitType.id,
    typeSnapshot: snapshotType(unitType),
    factionId: command.factionId,
    color: command.color ?? unitType.defaultColor,
    icon: copyIcon(command.icon ?? unitType.icon),
    note: command.note ?? '',
    status: command.status ?? 'active',
    position: { ...command.position },
  }
  const next = changedDocument(document, command, { units: [...document.units, unit] })
  return result(document, next)
}

function moveUnit(
  document: ScenarioDocumentV1,
  command: Extract<ScenarioCommand, { type: 'moveUnit' }>,
): CommandResult {
  const index = document.units.findIndex((unit) => unit.id === command.unitId)
  if (index < 0) fail('NOT_FOUND', "L'unité demandée est introuvable.", { unitId: command.unitId })
  const unit = document.units[index]
  if (!unit) return result(document, document)
  assertInside(document, command.to)
  if (samePosition(unit.position, command.to)) return result(document, document)
  if (
    document.units.some(
      (candidate) => candidate.id !== command.unitId && samePosition(candidate.position, command.to),
    )
  ) {
    fail('CELL_OCCUPIED', 'Cette case contient déjà une unité.', { position: command.to })
  }
  const units = updateAt(document.units, index, (current) => ({
    ...current,
    position: { ...command.to },
  }))
  return result(document, changedDocument(document, command, { units }))
}

function positionKey(position: Position): string {
  return `${position.row}:${position.column}`
}

export function previewMoveUnits(
  document: ScenarioDocumentV1,
  requestedUnitIds: readonly string[],
  delta: Position,
): MoveUnitsPreview {
  const unitIds = [...new Set(requestedUnitIds)]
  if (!unitIds.length) return { moves: [], changed: false }

  const unitsById = new Map(document.units.map((unit) => [unit.id, unit]))
  const missingId = unitIds.find((unitId) => !unitsById.has(unitId))
  if (missingId) {
    fail('NOT_FOUND', "L'une des unités demandées est introuvable.", { unitId: missingId })
  }

  if (!Number.isInteger(delta.row) || !Number.isInteger(delta.column)) {
    fail('OUT_OF_BOUNDS', 'Le déplacement doit correspondre à un nombre entier de cases.', {
      delta,
    })
  }

  const moves = unitIds.map((unitId) => {
    const unit = unitsById.get(unitId)
    if (!unit) throw new Error('Unreachable: unit identifiers were validated above.')
    return {
      unitId,
      from: { ...unit.position },
      to: {
        row: unit.position.row + delta.row,
        column: unit.position.column + delta.column,
      },
    }
  })
  if (delta.row === 0 && delta.column === 0) {
    return { moves, changed: false }
  }

  const selectedIds = new Set(unitIds)
  const destinationOwners = new Map<string, string>()

  // Toutes les destinations sont validées avant de produire le document. Une unité peut prendre
  // la case d'une voisine sélectionnée, car cette dernière se déplace dans la même commande.
  for (const move of moves) {
    const destination = move.to
    assertInside(document, destination)

    const key = positionKey(destination)
    const otherSelectedUnitId = destinationOwners.get(key)
    if (otherSelectedUnitId) {
      fail('CELL_OCCUPIED', 'Plusieurs unités de la sélection arriveraient sur la même case.', {
        position: destination,
        unitIds: [otherSelectedUnitId, move.unitId],
      })
    }
    destinationOwners.set(key, move.unitId)
  }

  const occupiedByUnselected = new Map(
    document.units
      .filter((unit) => !selectedIds.has(unit.id))
      .map((unit) => [positionKey(unit.position), unit.id]),
  )
  for (const move of moves) {
    const occupantId = occupiedByUnselected.get(positionKey(move.to))
    if (occupantId) {
      fail('CELL_OCCUPIED', 'Cette case contient déjà une unité.', {
        position: move.to,
        unitId: move.unitId,
        occupantId,
      })
    }
  }

  return { moves, changed: true }
}

function moveUnits(
  document: ScenarioDocumentV1,
  command: Extract<ScenarioCommand, { type: 'moveUnits' }>,
): CommandResult {
  const preview = previewMoveUnits(document, command.unitIds, command.delta)
  if (!preview.changed) return result(document, document)

  const destinations = new Map(preview.moves.map((move) => [move.unitId, move.to]))

  const units = document.units.map((unit) => {
    const destination = destinations.get(unit.id)
    return destination ? { ...unit, position: { ...destination } } : unit
  })
  return result(document, changedDocument(document, command, { units }))
}

function updateUnit(
  document: ScenarioDocumentV1,
  command: Extract<ScenarioCommand, { type: 'updateUnit' }>,
): CommandResult {
  const index = document.units.findIndex((unit) => unit.id === command.unitId)
  if (index < 0) fail('NOT_FOUND', "L'unité demandée est introuvable.", { unitId: command.unitId })
  const current = document.units[index]
  if (!current) return result(document, document)
  if (command.changes.factionId !== undefined) {
    requireFaction(document, command.changes.factionId)
  }

  const nextIcon = command.changes.icon ?? current.icon
  const hasChanges = Object.entries(command.changes).some(([key, value]) => {
    if (key === 'icon') return !sameIcon(current.icon, value as IconRef)
    return current[key as keyof TacticalUnit] !== value
  })
  if (!hasChanges) return result(document, document)

  const units = updateAt(document.units, index, (unit) => ({
    ...unit,
    ...command.changes,
    icon: copyIcon(nextIcon),
  }))
  return result(document, changedDocument(document, command, { units }))
}

function updateUnits(
  document: ScenarioDocumentV1,
  command: Extract<ScenarioCommand, { type: 'updateUnits' }>,
): CommandResult {
  const unitIds = [...new Set(command.unitIds)]
  if (!unitIds.length) return result(document, document)

  const selectedIds = new Set(unitIds)
  const existingIds = new Set(document.units.map((unit) => unit.id))
  const missingId = unitIds.find((unitId) => !existingIds.has(unitId))
  if (missingId) {
    fail('NOT_FOUND', "L'une des unités demandées est introuvable.", { unitId: missingId })
  }
  if (command.changes.factionId !== undefined) {
    requireFaction(document, command.changes.factionId)
  }

  let changed = false
  const units = document.units.map((unit) => {
    if (!selectedIds.has(unit.id)) return unit
    const nextIcon = command.changes.icon ?? unit.icon
    const hasChanges = Object.entries(command.changes).some(([key, value]) => {
      if (key === 'icon') return !sameIcon(unit.icon, value as IconRef)
      return unit[key as keyof TacticalUnit] !== value
    })
    if (!hasChanges) return unit
    changed = true
    return {
      ...unit,
      ...command.changes,
      icon: copyIcon(nextIcon),
    }
  })

  return changed
    ? result(document, changedDocument(document, command, { units }))
    : result(document, document)
}

function changeUnitType(
  document: ScenarioDocumentV1,
  command: Extract<ScenarioCommand, { type: 'changeUnitType' }>,
): CommandResult {
  const index = document.units.findIndex((unit) => unit.id === command.unitId)
  if (index < 0) fail('NOT_FOUND', "L'unité demandée est introuvable.", { unitId: command.unitId })
  const current = document.units[index]
  if (!current) return result(document, document)
  const unitType = requireAvailableType(document, command.typeId)
  const resetAppearance = command.resetAppearance ?? true
  const units = updateAt(document.units, index, (unit) => ({
    ...unit,
    typeId: unitType.id,
    typeSnapshot: snapshotType(unitType),
    name: resetAppearance ? unitType.name : unit.name,
    color: resetAppearance ? unitType.defaultColor : unit.color,
    icon: resetAppearance ? copyIcon(unitType.icon) : unit.icon,
  }))
  return result(document, changedDocument(document, command, { units }))
}

function reachObjective(
  document: ScenarioDocumentV1,
  command: Extract<ScenarioCommand, { type: 'reachObjective' }>,
): CommandResult {
  if (command.unitId === command.objectiveUnitId) {
    fail('INVALID_REFERENCE', 'Le commandant et l’objectif doivent être deux unités distinctes.')
  }
  const commander = document.units.find((unit) => unit.id === command.unitId)
  if (!commander) {
    fail('NOT_FOUND', 'Le commandant demandé est introuvable.', { unitId: command.unitId })
  }
  const objective = document.units.find((unit) => unit.id === command.objectiveUnitId)
  if (!objective) {
    fail('NOT_FOUND', "L’unité objectif demandée est introuvable.", {
      objectiveUnitId: command.objectiveUnitId,
    })
  }
  if (commander.typeId !== 'commander') {
    fail('INVALID_REFERENCE', 'Seul un Commandant peut atteindre un objectif.', {
      unitId: command.unitId,
      typeId: commander.typeId,
    })
  }
  if (objective.typeId !== 'objective') {
    fail('INVALID_REFERENCE', "L’unité de destination n’est pas un Objectif.", {
      objectiveUnitId: command.objectiveUnitId,
      typeId: objective.typeId,
    })
  }
  if (
    document.units.some(
      (unit) =>
        unit.id !== commander.id &&
        unit.id !== objective.id &&
        samePosition(unit.position, objective.position),
    )
  ) {
    fail('CELL_OCCUPIED', 'La case de l’objectif contient une autre unité.', {
      position: objective.position,
    })
  }

  const units = document.units
    .filter((unit) => unit.id !== objective.id)
    .map((unit) =>
      unit.id === commander.id ? { ...unit, position: { ...objective.position } } : unit,
    )
  return result(document, changedDocument(document, command, { units }), {
    removedUnitIds: [objective.id],
    removedAnnotationIds: [],
  })
}

function addAnnotation(
  document: ScenarioDocumentV1,
  command: Extract<ScenarioCommand, { type: 'addAnnotation' }>,
): CommandResult {
  if (document.annotations.some((annotation) => annotation.id === command.annotation.id)) {
    fail('DUPLICATE_ID', "Cet identifiant d'annotation existe déjà.", {
      annotationId: command.annotation.id,
    })
  }
  assertPositionInside(document, command.annotation)
  const annotation =
    command.annotation.kind === 'arrow'
      ? {
          ...command.annotation,
          start: { ...command.annotation.start },
          end: { ...command.annotation.end },
        }
      : { ...command.annotation, position: { ...command.annotation.position } }
  return result(
    document,
    changedDocument(document, command, { annotations: [...document.annotations, annotation] }),
  )
}

function updateAnnotation(
  document: ScenarioDocumentV1,
  command: Extract<ScenarioCommand, { type: 'updateAnnotation' }>,
): CommandResult {
  const index = document.annotations.findIndex(
    (annotation) => annotation.id === command.annotationId,
  )
  if (index < 0) {
    fail('NOT_FOUND', "L'annotation demandée est introuvable.", {
      annotationId: command.annotationId,
    })
  }
  const current = document.annotations[index]
  if (!current) return result(document, document)
  if (current.kind !== command.changes.kind) {
    fail('INVALID_ANNOTATION_UPDATE', "Le type d'une annotation ne peut pas être modifié.")
  }
  const candidate = { ...current, ...command.changes } as BoardAnnotation
  assertPositionInside(document, candidate)
  const hasChanges = Object.entries(command.changes).some(([key, value]) => {
    if (key === 'kind') return false
    const currentValue = current[key as keyof BoardAnnotation]
    if (
      typeof value === 'object' &&
      value !== null &&
      'row' in value &&
      typeof currentValue === 'object' &&
      currentValue !== null &&
      'row' in currentValue
    ) {
      return !samePosition(currentValue as Position, value as Position)
    }
    return currentValue !== value
  })
  if (!hasChanges) return result(document, document)
  const annotations = updateAt(document.annotations, index, () => candidate)
  return result(document, changedDocument(document, command, { annotations }))
}

function updateFaction(
  document: ScenarioDocumentV1,
  command: Extract<ScenarioCommand, { type: 'updateFaction' }>,
): CommandResult {
  const index = document.factions.findIndex((faction) => faction.id === command.factionId)
  if (index < 0) fail('NOT_FOUND', 'La faction demandée est introuvable.', { factionId: command.factionId })
  const current = document.factions[index]
  if (!current) return result(document, document)
  const hasChanges = Object.entries(command.changes).some(
    ([key, value]) => current[key as keyof Faction] !== value,
  )
  if (!hasChanges) return result(document, document)
  const factions = updateAt(document.factions, index, (faction) => ({
    ...faction,
    ...command.changes,
  }))
  return result(document, changedDocument(document, command, { factions }))
}

function removeFaction(
  document: ScenarioDocumentV1,
  command: Extract<ScenarioCommand, { type: 'removeFaction' }>,
): CommandResult {
  const faction = document.factions.find((candidate) => candidate.id === command.factionId)
  if (!faction) fail('NOT_FOUND', 'La faction demandée est introuvable.', { factionId: command.factionId })
  if (document.factions.length === 1) {
    fail('LAST_FACTION', 'Un scénario doit conserver au moins une faction.')
  }
  const used = document.units.some((unit) => unit.factionId === command.factionId)
  if (used && !command.replacementFactionId) {
    fail('INVALID_REFERENCE', 'Choisissez une faction de remplacement pour les unités existantes.')
  }
  if (command.replacementFactionId) {
    if (command.replacementFactionId === command.factionId) {
      fail('INVALID_REFERENCE', 'La faction de remplacement doit être différente.')
    }
    requireFaction(document, command.replacementFactionId)
  }
  const units = used
    ? document.units.map((unit) =>
        unit.factionId === command.factionId
          ? { ...unit, factionId: command.replacementFactionId as string }
          : unit,
      )
    : document.units
  const factions = document.factions.filter((candidate) => candidate.id !== command.factionId)
  return result(document, changedDocument(document, command, { factions, units }))
}

function updateCustomType(
  document: ScenarioDocumentV1,
  command: Extract<ScenarioCommand, { type: 'updateCustomUnitType' }>,
): CommandResult {
  const index = document.customUnitTypes.findIndex(
    (unitType) => unitType.id === command.unitTypeId,
  )
  if (index < 0) {
    fail('NOT_FOUND', "Le type d'unité personnalisé est introuvable.", {
      unitTypeId: command.unitTypeId,
    })
  }
  const current = document.customUnitTypes[index]
  if (!current) return result(document, document)
  const hasChanges = Object.entries(command.changes).some(([key, value]) => {
    if (key === 'icon') return !sameIcon(current.icon, value as IconRef)
    return current[key as keyof CustomUnitType] !== value
  })
  if (!hasChanges) return result(document, document)
  const customUnitTypes = updateAt(document.customUnitTypes, index, (unitType) => ({
    ...unitType,
    ...command.changes,
    icon: command.changes.icon ? copyIcon(command.changes.icon) : unitType.icon,
  }))
  return result(document, changedDocument(document, command, { customUnitTypes }))
}

function archiveCustomType(
  document: ScenarioDocumentV1,
  command: Extract<ScenarioCommand, { type: 'archiveCustomUnitType' }>,
): CommandResult {
  const index = document.customUnitTypes.findIndex(
    (unitType) => unitType.id === command.unitTypeId,
  )
  if (index < 0) {
    fail('NOT_FOUND', "Le type d'unité personnalisé est introuvable.", {
      unitTypeId: command.unitTypeId,
    })
  }
  if (document.customUnitTypes[index]?.archived) return result(document, document)
  const customUnitTypes = updateAt(document.customUnitTypes, index, (unitType) => ({
    ...unitType,
    archived: true,
  }))
  return result(document, changedDocument(document, command, { customUnitTypes }))
}

/**
 * Reducer métier pur du scénario : il ne modifie jamais ses entrées et ne lit ni heure ni hasard.
 * Une commande invalide lève DomainError et laisse le document fourni intact.
 */
export function applyCommand(
  document: ScenarioDocumentV1,
  command: ScenarioCommand,
): CommandResult {
  switch (command.type) {
    case 'renameScenario': {
      if (document.name === command.name) return result(document, document)
      return result(
        document,
        changedDocument(document, command, { name: command.name }),
      )
    }
    case 'updateScenarioMetadata':
      return updateScenarioMetadata(document, command)
    case 'setScenarioStatus': {
      if (document.status === command.status) return result(document, document)
      return result(document, changedDocument(document, command, { status: command.status }))
    }
    case 'updateScenarioProgress':
      return updateScenarioProgress(document, command)
    case 'setCoordinatesVisibility': {
      if (document.grid.showCoordinates === command.visible) return result(document, document)
      return result(
        document,
        changedDocument(document, command, {
          grid: { ...document.grid, showCoordinates: command.visible },
        }),
      )
    }
    case 'resizeGrid':
      return applyResize(document, command)
    case 'addFaction': {
      if (document.factions.some((faction) => faction.id === command.faction.id)) {
        fail('DUPLICATE_ID', 'Cet identifiant de faction existe déjà.', {
          factionId: command.faction.id,
        })
      }
      return result(
        document,
        changedDocument(document, command, {
          factions: [...document.factions, { role: 'custom', ...command.faction }],
        }),
      )
    }
    case 'updateFaction':
      return updateFaction(document, command)
    case 'removeFaction':
      return removeFaction(document, command)
    case 'addCustomUnitType': {
      if (findUnitType(command.unitType.id, document.customUnitTypes)) {
        fail('DUPLICATE_ID', "Cet identifiant de type d'unité existe déjà.", {
          unitTypeId: command.unitType.id,
        })
      }
      const customUnitType: CustomUnitType = {
        ...command.unitType,
        builtin: false,
        icon: copyIcon(command.unitType.icon),
      }
      return result(
        document,
        changedDocument(document, command, {
          customUnitTypes: [...document.customUnitTypes, customUnitType],
        }),
      )
    }
    case 'updateCustomUnitType':
      return updateCustomType(document, command)
    case 'archiveCustomUnitType':
      return archiveCustomType(document, command)
    case 'placeUnit':
      return placeUnit(document, command)
    case 'moveUnit':
      return moveUnit(document, command)
    case 'moveUnits':
      return moveUnits(document, command)
    case 'updateUnit':
      return updateUnit(document, command)
    case 'updateUnits':
      return updateUnits(document, command)
    case 'changeUnitType':
      return changeUnitType(document, command)
    case 'removeUnit': {
      const index = document.units.findIndex((unit) => unit.id === command.unitId)
      if (index < 0) fail('NOT_FOUND', "L'unité demandée est introuvable.", { unitId: command.unitId })
      const units = [...document.units.slice(0, index), ...document.units.slice(index + 1)]
      return result(document, changedDocument(document, command, { units }))
    }
    case 'removeUnits': {
      const unitIds = [...new Set(command.unitIds)]
      if (!unitIds.length) return result(document, document)
      const existingIds = new Set(document.units.map((unit) => unit.id))
      const missingId = unitIds.find((unitId) => !existingIds.has(unitId))
      if (missingId) {
        fail('NOT_FOUND', "L'une des unités demandées est introuvable.", { unitId: missingId })
      }
      const selectedIds = new Set(unitIds)
      const units = document.units.filter((unit) => !selectedIds.has(unit.id))
      return result(
        document,
        changedDocument(document, command, { units }),
        { removedUnitIds: unitIds, removedAnnotationIds: [] },
      )
    }
    case 'reachObjective':
      return reachObjective(document, command)
    case 'addAnnotation':
      return addAnnotation(document, command)
    case 'updateAnnotation':
      return updateAnnotation(document, command)
    case 'removeAnnotation': {
      const index = document.annotations.findIndex(
        (annotation) => annotation.id === command.annotationId,
      )
      if (index < 0) {
        fail('NOT_FOUND', "L'annotation demandée est introuvable.", {
          annotationId: command.annotationId,
        })
      }
      const annotations = [
        ...document.annotations.slice(0, index),
        ...document.annotations.slice(index + 1),
      ]
      return result(document, changedDocument(document, command, { annotations }))
    }
    case 'clearBoard': {
      if (document.units.length === 0 && document.annotations.length === 0) {
        return result(document, document)
      }
      const effects = {
        removedUnitIds: document.units.map((unit) => unit.id),
        removedAnnotationIds: document.annotations.map((annotation) => annotation.id),
      }
      return result(
        document,
        changedDocument(document, command, { units: [], annotations: [] }),
        effects,
      )
    }
  }
}

/** Adaptateur de compatibilité pour les appelants qui attendent seulement le document suivant. */
export function reduceScenario(
  document: ScenarioDocumentV1,
  command: ScenarioCommand,
): ScenarioDocumentV1 {
  return applyCommand(document, command).document
}

export function isDomainError(error: unknown): error is DomainError {
  return error instanceof DomainError
}

export function makeAnnotationChanges<T extends AnnotationChanges>(changes: T): T {
  return changes
}
