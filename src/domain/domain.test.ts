import { describe, expect, it } from 'vitest'

import {
  BUILT_IN_UNIT_TYPES,
  DomainError,
  SCENARIO_FORMAT_VERSION,
  applyCommand,
  applyCommandToHistory,
  createDefaultScenario,
  createHistory,
  migrateScenarioDocumentV1,
  previewMoveUnits,
  previewResize,
  pushHistory,
  redoHistory,
  undoHistory,
  type CustomUnitType,
  type LegacyScenarioDocumentV1,
  type ScenarioDocumentV1,
} from './index'

function scenario(): ScenarioDocumentV1 {
  return createDefaultScenario('Opération test', {
    id: 'scenario-1',
    now: '2026-07-18T00:00:00.000Z',
    blueFactionId: 'blue',
    redFactionId: 'red',
  })
}

function place(
  document: ScenarioDocumentV1,
  unitId: string,
  row: number,
  column: number,
  typeId = 'infantry',
): ScenarioDocumentV1 {
  return applyCommand(document, {
    type: 'placeUnit',
    unitId,
    typeId,
    factionId: 'blue',
    position: { row, column },
    at: '2026-07-18T00:01:00.000Z',
  }).document
}

const droneType: CustomUnitType = {
  id: 'drone',
  name: 'Drone',
  category: 'Aérien',
  defaultColor: '#12abcd',
  icon: { kind: 'asset', assetId: 'asset-drone' },
  builtin: false,
  archived: false,
}

describe('catalogue et scénario initial', () => {
  it('fournit les quinze types tactiques et les six pièces classiques sans changer les IDs existants', () => {
    expect(BUILT_IN_UNIT_TYPES).toHaveLength(21)
    expect(BUILT_IN_UNIT_TYPES.slice(0, 15).map((type) => type.id)).toEqual([
      'commander',
      'strategist',
      'infantry',
      'cavalry',
      'tank',
      'artillery',
      'aircraft',
      'ship',
      'medic',
      'engineer',
      'base',
      'objective',
      'fortress',
      'obstacle',
      'custom-piece',
    ])
    expect(BUILT_IN_UNIT_TYPES.slice(15).every((type) => type.category === 'Échecs')).toBe(true)
    expect(Object.isFrozen(BUILT_IN_UNIT_TYPES)).toBe(true)
    expect(BUILT_IN_UNIT_TYPES.every((type) => Object.isFrozen(type))).toBe(true)
  })

  it('crée un document V2 avec cinq factions sémantiques stables', () => {
    const document = scenario()
    expect(document).toMatchObject({
      formatVersion: SCENARIO_FORMAT_VERSION,
      id: 'scenario-1',
      name: 'Opération test',
      objective: '',
      status: 'active',
      grid: { rows: 8, columns: 8, showCoordinates: true },
    })
    expect(document.factions).toEqual([
      { id: 'blue', name: 'Mes forces', color: '#3b82f6', role: 'own' },
      { id: 'red', name: 'Obstacles', color: '#ef4444', role: 'obstacle' },
      { id: 'rally', name: 'À rallier', color: '#f59e0b', role: 'rally' },
      {
        id: 'uncertain',
        name: 'Incertain ou perdu',
        color: '#64748b',
        role: 'uncertain',
      },
      { id: 'objectives', name: 'Objectifs', color: '#eab308', role: 'objective' },
    ])
    expect(document.units).toEqual([])
    expect(document.annotations).toEqual([])

    expect(createDefaultScenario().factions.map((faction) => faction.id)).toEqual([
      'own-forces',
      'obstacles',
      'rally',
      'uncertain',
      'objectives',
    ])
  })

  it('migre purement un document V1 sans perdre ses données ni ses identifiants', () => {
    const legacy: LegacyScenarioDocumentV1 = {
      formatVersion: 1,
      id: 'legacy',
      name: 'Ancien scénario',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-02-01T00:00:00.000Z',
      grid: { rows: 7, columns: 9, showCoordinates: false },
      factions: [
        { id: 'allies-renamed', name: 'Alliés', color: '#123456' },
        { id: 'red', name: 'Rouge', color: '#ef4444' },
        { id: 'third', name: 'Partenaires', color: '#abcdef' },
      ],
      customUnitTypes: [droneType],
      units: [],
      annotations: [],
    }

    const migrated = migrateScenarioDocumentV1(legacy)

    expect(migrated).toMatchObject({
      formatVersion: 2,
      id: 'legacy',
      name: 'Ancien scénario',
      objective: '',
      status: 'active',
      createdAt: legacy.createdAt,
      updatedAt: legacy.updatedAt,
      grid: legacy.grid,
    })
    expect(migrated.factions.map((faction) => faction.role)).toEqual([
      'own',
      'obstacle',
      'custom',
      'rally',
      'uncertain',
      'objective',
    ])
    expect(migrated.customUnitTypes).toBe(legacy.customUnitTypes)
    expect(migrated.units).toBe(legacy.units)
    expect(migrated.annotations).toBe(legacy.annotations)
    expect(legacy).not.toHaveProperty('objective')
  })
})

describe('métadonnées et cycle de vie du scénario', () => {
  it('met à jour objectif, période, continuité et statut par commandes pures', () => {
    const initial = scenario()
    const described = applyCommand(initial, {
      type: 'updateScenarioMetadata',
      changes: {
        objective: 'Stabiliser la situation',
        period: { start: '2026-07-01', target: '2026-09-01' },
        previousScenarioId: 'scenario-0',
      },
      at: '2026-07-18T00:02:00.000Z',
    }).document
    const progressed = applyCommand(described, {
      type: 'updateScenarioProgress',
      current: '2026-08-01',
    }).document
    const archived = applyCommand(progressed, {
      type: 'setScenarioStatus',
      status: 'archived',
    }).document

    expect(archived).toMatchObject({
      objective: 'Stabiliser la situation',
      period: { start: '2026-07-01', current: '2026-08-01', target: '2026-09-01' },
      previousScenarioId: 'scenario-0',
      status: 'archived',
    })
    expect(described.updatedAt).toBe('2026-07-18T00:02:00.000Z')
    expect(initial).not.toHaveProperty('period')
  })

  it('préserve le partage structurel quand les métadonnées ne changent pas', () => {
    const initial = createDefaultScenario('Test', {
      objective: 'Objectif',
      period: { current: '2026-07-18' },
    })
    expect(
      applyCommand(initial, {
        type: 'updateScenarioMetadata',
        changes: { objective: 'Objectif', period: { current: '2026-07-18' } },
      }).document,
    ).toBe(initial)
    expect(
      applyCommand(initial, { type: 'updateScenarioProgress', current: '2026-07-18' }).document,
    ).toBe(initial)
  })
})

describe('unités', () => {
  it('place une unité avec un snapshot indépendant du type', () => {
    const withType = applyCommand(scenario(), {
      type: 'addCustomUnitType',
      unitType: droneType,
    }).document
    const placed = place(withType, 'unit-1', 2, 3, 'drone')
    const unit = placed.units[0]

    expect(unit).toMatchObject({
      id: 'unit-1',
      name: 'Drone',
      typeId: 'drone',
      factionId: 'blue',
      color: '#12abcd',
      status: 'active',
      position: { row: 2, column: 3 },
      typeSnapshot: { name: 'Drone', category: 'Aérien' },
    })
    expect(unit?.icon).not.toBe(droneType.icon)
    expect(unit?.typeSnapshot.icon).not.toBe(droneType.icon)
    expect(placed.updatedAt).toBe('2026-07-18T00:01:00.000Z')
  })

  it('refuse une deuxième unité sur la même case sans muter le document', () => {
    const first = place(scenario(), 'unit-1', 0, 0)

    expect(() => place(first, 'unit-2', 0, 0)).toThrowError(
      expect.objectContaining({ code: 'CELL_OCCUPIED' }),
    )
    expect(first.units).toHaveLength(1)
  })

  it('déplace librement une unité mais refuse une destination occupée', () => {
    const twoUnits = place(place(scenario(), 'unit-1', 0, 0), 'unit-2', 1, 1)
    const moved = applyCommand(twoUnits, {
      type: 'moveUnit',
      unitId: 'unit-1',
      to: { row: 2, column: 4 },
    }).document

    expect(moved.units.find((unit) => unit.id === 'unit-1')?.position).toEqual({
      row: 2,
      column: 4,
    })
    expect(() =>
      applyCommand(moved, {
        type: 'moveUnit',
        unitId: 'unit-1',
        to: { row: 1, column: 1 },
      }),
    ).toThrowError(expect.objectContaining({ code: 'CELL_OCCUPIED' }))
  })

  it('déplace une formation entière en conservant ses positions relatives', () => {
    const document = place(
      place(place(scenario(), 'unit-1', 1, 1), 'unit-2', 1, 2),
      'untouched',
      6,
      6,
    )
    const untouched = document.units.find((unit) => unit.id === 'untouched')
    const moved = applyCommand(document, {
      type: 'moveUnits',
      unitIds: ['unit-1', 'unit-2', 'unit-1'],
      delta: { row: 2, column: 1 },
      at: '2026-07-18T00:03:00.000Z',
    })

    expect(moved.changed).toBe(true)
    expect(
      moved.document.units
        .filter((unit) => unit.id !== 'untouched')
        .map((unit) => unit.position),
    ).toEqual([
      { row: 3, column: 2 },
      { row: 3, column: 3 },
    ])
    expect(moved.document.units.find((unit) => unit.id === 'untouched')).toBe(untouched)
    expect(moved.document.updatedAt).toBe('2026-07-18T00:03:00.000Z')
    expect(document.units[0]?.position).toEqual({ row: 1, column: 1 })
  })

  it('prévisualise les destinations avec la même validation que la commande', () => {
    const document = place(place(scenario(), 'unit-1', 1, 1), 'unit-2', 2, 3)

    expect(previewMoveUnits(document, ['unit-1', 'unit-2'], { row: 2, column: -1 })).toEqual({
      changed: true,
      moves: [
        { unitId: 'unit-1', from: { row: 1, column: 1 }, to: { row: 3, column: 0 } },
        { unitId: 'unit-2', from: { row: 2, column: 3 }, to: { row: 4, column: 2 } },
      ],
    })
    expect(previewMoveUnits(document, ['unit-1'], { row: 0, column: 0 })).toEqual({
      changed: false,
      moves: [
        { unitId: 'unit-1', from: { row: 1, column: 1 }, to: { row: 1, column: 1 } },
      ],
    })
    expect(() =>
      previewMoveUnits(document, ['unit-1'], { row: -2, column: 0 }),
    ).toThrowError(expect.objectContaining({ code: 'OUT_OF_BOUNDS' }))
  })

  it('autorise une formation à occuper les cases libérées par ses propres unités', () => {
    const document = place(place(scenario(), 'unit-1', 2, 2), 'unit-2', 2, 3)
    const moved = applyCommand(document, {
      type: 'moveUnits',
      unitIds: ['unit-1', 'unit-2'],
      delta: { row: 0, column: 1 },
    }).document

    expect(moved.units.map((unit) => unit.position)).toEqual([
      { row: 2, column: 3 },
      { row: 2, column: 4 },
    ])
  })

  it('refuse atomiquement une formation hors limites ou en collision externe', () => {
    const document = place(
      place(place(scenario(), 'unit-1', 0, 0), 'unit-2', 0, 1),
      'blocker',
      1,
      2,
    )

    expect(() =>
      applyCommand(document, {
        type: 'moveUnits',
        unitIds: ['unit-1', 'unit-2'],
        delta: { row: -1, column: 0 },
      }),
    ).toThrowError(expect.objectContaining({ code: 'OUT_OF_BOUNDS' }))
    expect(() =>
      applyCommand(document, {
        type: 'moveUnits',
        unitIds: ['unit-1', 'unit-2'],
        delta: { row: 1, column: 1 },
      }),
    ).toThrowError(expect.objectContaining({ code: 'CELL_OCCUPIED' }))
    expect(document.units.map((unit) => unit.position)).toEqual([
      { row: 0, column: 0 },
      { row: 0, column: 1 },
      { row: 1, column: 2 },
    ])
  })

  it('prévalide les identifiants et les collisions internes de la formation', () => {
    const document = place(place(scenario(), 'unit-1', 1, 1), 'unit-2', 1, 2)

    expect(() =>
      applyCommand(document, {
        type: 'moveUnits',
        unitIds: ['unit-1', 'missing'],
        delta: { row: 1, column: 0 },
      }),
    ).toThrowError(expect.objectContaining({ code: 'NOT_FOUND' }))

    const malformed = {
      ...document,
      units: document.units.map((unit) => ({
        ...unit,
        position: { row: 1, column: 1 },
      })),
    }
    expect(() =>
      applyCommand(malformed, {
        type: 'moveUnits',
        unitIds: ['unit-1', 'unit-2'],
        delta: { row: 1, column: 0 },
      }),
    ).toThrowError(expect.objectContaining({ code: 'CELL_OCCUPIED' }))
  })

  it('conserve le document pour une formation vide ou un déplacement nul', () => {
    const document = place(scenario(), 'unit-1', 1, 1)
    const empty = applyCommand(document, {
      type: 'moveUnits',
      unitIds: [],
      delta: { row: 1, column: 1 },
    })
    const stationary = applyCommand(document, {
      type: 'moveUnits',
      unitIds: ['unit-1'],
      delta: { row: 0, column: 0 },
    })

    expect(empty.changed).toBe(false)
    expect(empty.document).toBe(document)
    expect(stationary.changed).toBe(false)
    expect(stationary.document).toBe(document)
  })

  it('met à jour les propriétés et valide les références de faction', () => {
    const document = place(scenario(), 'unit-1', 0, 0)
    const updated = applyCommand(document, {
      type: 'updateUnit',
      unitId: 'unit-1',
      changes: {
        name: 'Éclaireur',
        factionId: 'red',
        status: 'wounded',
        note: 'Couverture au nord',
      },
    }).document

    expect(updated.units[0]).toMatchObject({
      name: 'Éclaireur',
      factionId: 'red',
      status: 'wounded',
      note: 'Couverture au nord',
    })
    expect(() =>
      applyCommand(document, {
        type: 'updateUnit',
        unitId: 'unit-1',
        changes: { factionId: 'missing' },
      }),
    ).toThrowError(expect.objectContaining({ code: 'INVALID_REFERENCE' }))
  })

  it('prend en charge le statut neutralisé', () => {
    const document = place(scenario(), 'unit-1', 0, 0)
    const neutralized = applyCommand(document, {
      type: 'updateUnit',
      unitId: 'unit-1',
      changes: { status: 'neutralized' },
    }).document

    expect(neutralized.units[0]?.status).toBe('neutralized')
  })

  it('met à jour plusieurs unités dans une seule commande atomique', () => {
    const document = place(
      place(place(scenario(), 'unit-1', 0, 0), 'unit-2', 0, 1),
      'unit-3',
      0,
      2,
    )
    const untouched = document.units.find((unit) => unit.id === 'unit-3')
    const updated = applyCommand(document, {
      type: 'updateUnits',
      unitIds: ['unit-1', 'unit-2', 'unit-1'],
      changes: { factionId: 'red', status: 'wounded' },
    })

    expect(updated.changed).toBe(true)
    expect(
      updated.document.units
        .filter((unit) => unit.id !== 'unit-3')
        .map(({ factionId, status }) => ({ factionId, status })),
    ).toEqual([
      { factionId: 'red', status: 'wounded' },
      { factionId: 'red', status: 'wounded' },
    ])
    expect(updated.document.units.find((unit) => unit.id === 'unit-3')).toBe(untouched)
    expect(document.units.every((unit) => unit.factionId === 'blue')).toBe(true)
  })

  it('refuse entièrement une mise à jour groupée si une référence est invalide', () => {
    const document = place(place(scenario(), 'unit-1', 0, 0), 'unit-2', 0, 1)

    expect(() =>
      applyCommand(document, {
        type: 'updateUnits',
        unitIds: ['unit-1', 'missing'],
        changes: { status: 'destroyed' },
      }),
    ).toThrowError(expect.objectContaining({ code: 'NOT_FOUND' }))
    expect(() =>
      applyCommand(document, {
        type: 'updateUnits',
        unitIds: ['unit-1', 'unit-2'],
        changes: { factionId: 'missing' },
      }),
    ).toThrowError(expect.objectContaining({ code: 'INVALID_REFERENCE' }))
    expect(document.units.map((unit) => unit.status)).toEqual(['active', 'active'])
  })

  it('ne crée aucun changement si tout le groupe possède déjà la valeur demandée', () => {
    const document = place(place(scenario(), 'unit-1', 0, 0), 'unit-2', 0, 1)
    const result = applyCommand(document, {
      type: 'updateUnits',
      unitIds: ['unit-1', 'unit-2'],
      changes: { status: 'active' },
    })

    expect(result.changed).toBe(false)
    expect(result.document).toBe(document)
  })

  it('retire une sélection multiple dans une seule commande', () => {
    const document = place(
      place(place(scenario(), 'unit-1', 0, 0), 'unit-2', 0, 1),
      'unit-3',
      0,
      2,
    )
    const removed = applyCommand(document, {
      type: 'removeUnits',
      unitIds: ['unit-1', 'unit-2'],
    })

    expect(removed.document.units.map((unit) => unit.id)).toEqual(['unit-3'])
    expect(removed.effects.removedUnitIds).toEqual(['unit-1', 'unit-2'])
    expect(document.units).toHaveLength(3)
  })

  it('retire un objectif et y déplace le Commandant dans une action atomique', () => {
    const withCommander = place(scenario(), 'commander-1', 0, 0, 'commander')
    const withObjective = place(withCommander, 'objective-1', 4, 5, 'objective')
    const reached = applyCommand(withObjective, {
      type: 'reachObjective',
      unitId: 'commander-1',
      objectiveUnitId: 'objective-1',
    })

    expect(reached.document.units).toHaveLength(1)
    expect(reached.document.units[0]).toMatchObject({
      id: 'commander-1',
      position: { row: 4, column: 5 },
    })
    expect(reached.effects.removedUnitIds).toEqual(['objective-1'])
    expect(withObjective.units).toHaveLength(2)
  })

  it('refuse d’atteindre un objectif avec un autre type d’unité', () => {
    const withInfantry = place(scenario(), 'infantry-1', 0, 0, 'infantry')
    const withObjective = place(withInfantry, 'objective-1', 1, 1, 'objective')

    expect(() =>
      applyCommand(withObjective, {
        type: 'reachObjective',
        unitId: 'infantry-1',
        objectiveUnitId: 'objective-1',
      }),
    ).toThrowError(expect.objectContaining({ code: 'INVALID_REFERENCE' }))
  })
})

describe('types personnalisés et snapshots', () => {
  it('ne répercute pas la modification du type sur les unités déjà placées', () => {
    const withType = applyCommand(scenario(), {
      type: 'addCustomUnitType',
      unitType: droneType,
    }).document
    const first = place(withType, 'unit-old', 0, 0, 'drone')
    const changedType = applyCommand(first, {
      type: 'updateCustomUnitType',
      unitTypeId: 'drone',
      changes: {
        name: 'Drone Mk II',
        defaultColor: '#abcdef',
        icon: { kind: 'catalog', name: 'plane' },
      },
    }).document
    const second = place(changedType, 'unit-new', 0, 1, 'drone')

    expect(second.units.find((unit) => unit.id === 'unit-old')).toMatchObject({
      name: 'Drone',
      color: '#12abcd',
      typeSnapshot: { name: 'Drone', defaultColor: '#12abcd' },
    })
    expect(second.units.find((unit) => unit.id === 'unit-new')).toMatchObject({
      name: 'Drone Mk II',
      color: '#abcdef',
      typeSnapshot: { name: 'Drone Mk II', defaultColor: '#abcdef' },
    })
  })

  it('archive le type sans casser les unités et interdit les nouveaux placements', () => {
    const withType = applyCommand(scenario(), {
      type: 'addCustomUnitType',
      unitType: droneType,
    }).document
    const placed = place(withType, 'unit-1', 0, 0, 'drone')
    const archived = applyCommand(placed, {
      type: 'archiveCustomUnitType',
      unitTypeId: 'drone',
    }).document

    expect(archived.customUnitTypes[0]?.archived).toBe(true)
    expect(archived.units[0]?.typeSnapshot.name).toBe('Drone')
    expect(() => place(archived, 'unit-2', 0, 1, 'drone')).toThrowError(
      expect.objectContaining({ code: 'INVALID_REFERENCE' }),
    )
  })

  it('copie le libellé, la couleur et l’icône lors du changement de type', () => {
    const original = applyCommand(place(scenario(), 'unit-1', 0, 0), {
      type: 'updateUnit',
      unitId: 'unit-1',
      changes: { name: 'Nom personnel', color: '#000000' },
    }).document
    const changed = applyCommand(original, {
      type: 'changeUnitType',
      unitId: 'unit-1',
      typeId: 'medic',
    }).document

    expect(changed.units[0]).toMatchObject({
      typeId: 'medic',
      name: 'Médecin',
      color: '#4ade80',
      icon: { kind: 'catalog', name: 'briefcase-medical' },
      typeSnapshot: { typeId: 'medic', name: 'Médecin' },
    })
  })
})

describe('factions', () => {
  it('attribue le rôle custom aux nouvelles factions sans rôle explicite', () => {
    const document = applyCommand(scenario(), {
      type: 'addFaction',
      faction: { id: 'partners', name: 'Partenaires', color: '#22c55e' },
    }).document

    expect(document.factions.at(-1)).toEqual({
      id: 'partners',
      name: 'Partenaires',
      color: '#22c55e',
      role: 'custom',
    })
  })

  it('renomme et recolore une faction sans modifier les couleurs individuelles', () => {
    const document = place(scenario(), 'unit-1', 0, 0)
    const updated = applyCommand(document, {
      type: 'updateFaction',
      factionId: 'blue',
      changes: { name: 'Alliés', color: '#0ea5e9' },
    }).document

    expect(updated.factions[0]).toMatchObject({ name: 'Alliés', color: '#0ea5e9' })
    expect(updated.units[0]?.color).toBe('#94a3b8')
  })

  it('réaffecte les unités avant de supprimer une faction', () => {
    const document = place(scenario(), 'unit-1', 0, 0)
    const result = applyCommand(document, {
      type: 'removeFaction',
      factionId: 'blue',
      replacementFactionId: 'red',
    }).document

    expect(result.factions.map((faction) => faction.id)).toEqual([
      'red',
      'rally',
      'uncertain',
      'objectives',
    ])
    expect(result.units[0]?.factionId).toBe('red')
  })
})

describe('annotations et redimensionnement', () => {
  it('ajoute et modifie les deux catégories d’annotation', () => {
    const withArrow = applyCommand(scenario(), {
      type: 'addAnnotation',
      annotation: {
        id: 'arrow-1',
        kind: 'arrow',
        start: { row: 0, column: 0 },
        end: { row: 4, column: 4 },
        color: '#ef4444',
        style: 'attack',
      },
    }).document
    const withMarker = applyCommand(withArrow, {
      type: 'addAnnotation',
      annotation: {
        id: 'marker-1',
        kind: 'marker',
        position: { row: 2, column: 2 },
        color: '#fbbf24',
        markerType: 'objective',
        label: 'Pont',
      },
    }).document
    const updated = applyCommand(withMarker, {
      type: 'updateAnnotation',
      annotationId: 'arrow-1',
      changes: { kind: 'arrow', style: 'support', end: { row: 3, column: 4 } },
    }).document

    expect(updated.annotations).toHaveLength(2)
    expect(updated.annotations[0]).toMatchObject({ style: 'support', end: { row: 3, column: 4 } })
  })

  it('prévisualise puis retire en une commande les éléments hors limites', () => {
    let document = place(scenario(), 'inside', 0, 0)
    document = place(document, 'outside', 7, 7)
    document = applyCommand(document, {
      type: 'addAnnotation',
      annotation: {
        id: 'cross-border',
        kind: 'arrow',
        start: { row: 1, column: 1 },
        end: { row: 7, column: 7 },
        color: '#ffffff',
        style: 'movement',
      },
    }).document

    expect(previewResize(document, 5, 5)).toEqual({
      unitIds: ['outside'],
      annotationIds: ['cross-border'],
      unitCount: 1,
      annotationCount: 1,
    })
    expect(() =>
      applyCommand(document, { type: 'resizeGrid', rows: 5, columns: 5 }),
    ).toThrowError(expect.objectContaining({ code: 'RESIZE_CONFIRMATION_REQUIRED' }))

    const resized = applyCommand(document, {
      type: 'resizeGrid',
      rows: 5,
      columns: 5,
      confirmRemoval: true,
    })
    expect(resized.document.grid).toMatchObject({ rows: 5, columns: 5 })
    expect(resized.document.units.map((unit) => unit.id)).toEqual(['inside'])
    expect(resized.document.annotations).toEqual([])
    expect(resized.effects).toEqual({
      removedUnitIds: ['outside'],
      removedAnnotationIds: ['cross-border'],
    })
  })

  it('vide unités et annotations tout en conservant factions et types', () => {
    const populated = applyCommand(place(scenario(), 'unit-1', 0, 0), {
      type: 'addAnnotation',
      annotation: {
        id: 'marker-1',
        kind: 'marker',
        position: { row: 0, column: 0 },
        color: '#ffffff',
        markerType: 'rally',
        label: '',
      },
    }).document
    const cleared = applyCommand(populated, { type: 'clearBoard' })

    expect(cleared.document.units).toEqual([])
    expect(cleared.document.annotations).toEqual([])
    expect(cleared.document.factions).toBe(populated.factions)
    expect(cleared.effects.removedUnitIds).toEqual(['unit-1'])
  })
})

describe('partage structurel et historique', () => {
  it('conserve les références pour une commande sans effet', () => {
    const document = scenario()
    const noChange = applyCommand(document, {
      type: 'setCoordinatesVisibility',
      visible: true,
      at: '2099-01-01T00:00:00.000Z',
    })

    expect(noChange.changed).toBe(false)
    expect(noChange.document).toBe(document)
  })

  it('annule et rétablit des documents sans les recopier', () => {
    const initial = scenario()
    let history = createHistory(initial)
    const placedResult = applyCommandToHistory(history, {
      type: 'placeUnit',
      unitId: 'unit-1',
      typeId: 'infantry',
      factionId: 'blue',
      position: { row: 0, column: 0 },
    })
    history = placedResult.history
    const placed = history.present

    history = undoHistory(history)
    expect(history.present).toBe(initial)
    history = redoHistory(history)
    expect(history.present).toBe(placed)
  })

  it('annule en une action le déplacement atomique sur un objectif', () => {
    const withCommander = place(scenario(), 'commander-1', 0, 0, 'commander')
    const initial = place(withCommander, 'objective-1', 4, 4, 'objective')
    const applied = applyCommandToHistory(createHistory(initial), {
      type: 'reachObjective',
      unitId: 'commander-1',
      objectiveUnitId: 'objective-1',
    })

    expect(applied.history.past).toEqual([initial])
    expect(undoHistory(applied.history).present).toBe(initial)
  })

  it('annule et rétablit toute une mise à jour groupée en une seule action', () => {
    const initial = place(place(scenario(), 'unit-1', 0, 0), 'unit-2', 0, 1)
    const applied = applyCommandToHistory(createHistory(initial), {
      type: 'updateUnits',
      unitIds: ['unit-1', 'unit-2'],
      changes: { status: 'hidden' },
    })

    expect(applied.history.past).toEqual([initial])
    expect(applied.history.present.units.map((unit) => unit.status)).toEqual([
      'hidden',
      'hidden',
    ])
    const undone = undoHistory(applied.history)
    expect(undone.present).toBe(initial)
    expect(redoHistory(undone).present).toBe(applied.history.present)
  })

  it('annule et rétablit le déplacement de toute une formation en une seule action', () => {
    const initial = place(place(scenario(), 'unit-1', 1, 1), 'unit-2', 1, 2)
    const applied = applyCommandToHistory(createHistory(initial), {
      type: 'moveUnits',
      unitIds: ['unit-1', 'unit-2'],
      delta: { row: 2, column: 2 },
    })

    expect(applied.history.past).toEqual([initial])
    expect(applied.history.present.units.map((unit) => unit.position)).toEqual([
      { row: 3, column: 3 },
      { row: 3, column: 4 },
    ])
    const undone = undoHistory(applied.history)
    expect(undone.present).toBe(initial)
    expect(redoHistory(undone).present).toBe(applied.history.present)
  })

  it('limite le passé aux 100 dernières actions et efface le futur après une action', () => {
    let history = createHistory(0)
    for (let value = 1; value <= 125; value += 1) {
      history = pushHistory(history, value)
    }
    expect(history.past).toHaveLength(100)
    expect(history.past[0]).toBe(25)

    const undone = undoHistory(history)
    expect(undone.future).toEqual([125])
    const branched = pushHistory(undone, 999)
    expect(branched.future).toEqual([])
    expect(branched.present).toBe(999)
  })

  it('expose des erreurs métier reconnaissables', () => {
    try {
      applyCommand(scenario(), {
        type: 'resizeGrid',
        rows: 4,
        columns: 8,
      })
      throw new Error('La commande aurait dû échouer')
    } catch (error) {
      expect(error).toBeInstanceOf(DomainError)
      expect((error as DomainError).code).toBe('INVALID_GRID_SIZE')
    }
  })
})
