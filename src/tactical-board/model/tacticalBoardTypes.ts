/** Contrats métier persistés et commandes comprises par le reducer Tactical Board. */
export const LEGACY_SCENARIO_FORMAT_VERSION = 1 as const
export const SCENARIO_FORMAT_VERSION = 2 as const
export const MIN_GRID_SIZE = 5
export const MAX_GRID_SIZE = 20

export type EntityId = string
export type IsoDateString = string
export type HexColor = string

export const SCENARIO_STATUSES = ['active', 'archived'] as const
export type ScenarioStatus = (typeof SCENARIO_STATUSES)[number]

export interface ScenarioPeriod {
  readonly start?: IsoDateString
  readonly target?: IsoDateString
  readonly current?: IsoDateString
}

export interface Position {
  readonly row: number
  readonly column: number
}

export interface UnitMovePreview {
  readonly unitId: EntityId
  readonly from: Position
  readonly to: Position
}

export interface MoveUnitsPreview {
  readonly moves: readonly UnitMovePreview[]
  readonly changed: boolean
}

export interface GridConfig {
  readonly rows: number
  readonly columns: number
  readonly showCoordinates: boolean
}

export interface CatalogIconRef {
  readonly kind: 'catalog'
  readonly name: string
}

export interface AssetIconRef {
  readonly kind: 'asset'
  readonly assetId: EntityId
}

export type IconRef = CatalogIconRef | AssetIconRef

export const FACTION_ROLES = [
  'own',
  'obstacle',
  'rally',
  'uncertain',
  'objective',
  'custom',
] as const
export type FactionRole = (typeof FACTION_ROLES)[number]

export interface Faction {
  readonly id: EntityId
  readonly name: string
  readonly color: HexColor
  /** Rôle sémantique stable, indépendant du libellé modifiable de la faction. */
  readonly role: FactionRole
}

export type FactionInput = Omit<Faction, 'role'> & Partial<Pick<Faction, 'role'>>

interface UnitTypeBase {
  readonly id: EntityId
  readonly name: string
  readonly category: string
  readonly defaultColor: HexColor
  readonly icon: IconRef
}

export interface BuiltInUnitType extends UnitTypeBase {
  readonly builtin: true
  readonly archived: false
}

export interface CustomUnitType extends UnitTypeBase {
  readonly builtin: false
  readonly archived: boolean
}

export type UnitType = BuiltInUnitType | CustomUnitType

/** Copie durable : modifier ou archiver le type source n'altère jamais les unités placées. */
export interface UnitTypeSnapshot {
  readonly typeId: EntityId
  readonly name: string
  readonly category: string
  readonly defaultColor: HexColor
  readonly icon: IconRef
}

export const UNIT_STATUSES = ['active', 'wounded', 'neutralized', 'hidden', 'destroyed'] as const
export type UnitStatus = (typeof UNIT_STATUSES)[number]

export interface TacticalUnit {
  readonly id: EntityId
  readonly name: string
  readonly typeId: EntityId
  readonly typeSnapshot: UnitTypeSnapshot
  readonly factionId: EntityId
  readonly color: HexColor
  readonly icon: IconRef
  readonly note: string
  readonly status: UnitStatus
  readonly position: Position
}

export const ARROW_STYLES = ['attack', 'movement', 'support'] as const
export type ArrowStyle = (typeof ARROW_STYLES)[number]

export interface ArrowAnnotation {
  readonly id: EntityId
  readonly kind: 'arrow'
  readonly start: Position
  readonly end: Position
  readonly color: HexColor
  readonly style: ArrowStyle
}

export const MARKER_TYPES = ['objective', 'danger', 'rally'] as const
export type MarkerType = (typeof MARKER_TYPES)[number]

export interface MarkerAnnotation {
  readonly id: EntityId
  readonly kind: 'marker'
  readonly position: Position
  readonly color: HexColor
  readonly markerType: MarkerType
  readonly label: string
}

export type BoardAnnotation = ArrowAnnotation | MarkerAnnotation

interface ScenarioDocumentBase<TFaction extends { readonly id: EntityId }> {
  readonly id: EntityId
  readonly name: string
  readonly createdAt: IsoDateString
  readonly updatedAt: IsoDateString
  readonly grid: GridConfig
  readonly factions: readonly TFaction[]
  readonly customUnitTypes: readonly CustomUnitType[]
  readonly units: readonly TacticalUnit[]
  readonly annotations: readonly BoardAnnotation[]
}

/** Forme persistée antérieure aux objectifs, à la continuité et au cycle de vie du scénario. */
export interface LegacyScenarioDocumentV1 extends ScenarioDocumentBase<Omit<Faction, 'role'>> {
  readonly formatVersion: typeof LEGACY_SCENARIO_FORMAT_VERSION
}

export interface ScenarioDocumentV2 extends ScenarioDocumentBase<Faction> {
  readonly formatVersion: typeof SCENARIO_FORMAT_VERSION
  readonly objective: string
  readonly period?: ScenarioPeriod
  readonly status: ScenarioStatus
  readonly previousScenarioId?: EntityId
}

export type ScenarioDocument = ScenarioDocumentV2

/** @deprecated Alias conservé pour la compatibilité de l'API publique historique. */
export type ScenarioDocumentV1 = ScenarioDocumentV2

export type UnitEditableChanges = Partial<
  Pick<TacticalUnit, 'name' | 'factionId' | 'color' | 'icon' | 'note' | 'status'>
>

export type AnnotationChanges =
  | ({ readonly kind: 'arrow' } & Partial<
      Pick<ArrowAnnotation, 'start' | 'end' | 'color' | 'style'>
    >)
  | ({ readonly kind: 'marker' } & Partial<
      Pick<MarkerAnnotation, 'position' | 'color' | 'markerType' | 'label'>
    >)

export interface CommandBase {
  /** Sans date, updatedAt reste inchangé afin que la commande demeure déterministe. */
  readonly at?: IsoDateString
}

export type ScenarioMetadataChanges = Partial<
  Pick<ScenarioDocumentV2, 'name' | 'objective' | 'period' | 'previousScenarioId'>
>

export type ScenarioCommand =
  | ({ readonly type: 'renameScenario'; readonly name: string } & CommandBase)
  | ({
      readonly type: 'updateScenarioMetadata'
      readonly changes: ScenarioMetadataChanges
    } & CommandBase)
  | ({ readonly type: 'setScenarioStatus'; readonly status: ScenarioStatus } & CommandBase)
  | ({ readonly type: 'updateScenarioProgress'; readonly current?: IsoDateString } & CommandBase)
  | ({ readonly type: 'setCoordinatesVisibility'; readonly visible: boolean } & CommandBase)
  | ({
      readonly type: 'resizeGrid'
      readonly rows: number
      readonly columns: number
      readonly confirmRemoval?: boolean
    } & CommandBase)
  | ({ readonly type: 'addFaction'; readonly faction: FactionInput } & CommandBase)
  | ({
      readonly type: 'updateFaction'
      readonly factionId: EntityId
      readonly changes: Partial<Pick<Faction, 'name' | 'color'>>
    } & CommandBase)
  | ({
      readonly type: 'removeFaction'
      readonly factionId: EntityId
      readonly replacementFactionId?: EntityId
    } & CommandBase)
  | ({ readonly type: 'addCustomUnitType'; readonly unitType: CustomUnitType } & CommandBase)
  | ({
      readonly type: 'updateCustomUnitType'
      readonly unitTypeId: EntityId
      readonly changes: Partial<Pick<CustomUnitType, 'name' | 'category' | 'defaultColor' | 'icon'>>
    } & CommandBase)
  | ({ readonly type: 'archiveCustomUnitType'; readonly unitTypeId: EntityId } & CommandBase)
  | ({
      readonly type: 'placeUnit'
      readonly unitId: EntityId
      readonly typeId: EntityId
      readonly factionId: EntityId
      readonly position: Position
      readonly name?: string
      readonly color?: HexColor
      readonly icon?: IconRef
      readonly note?: string
      readonly status?: UnitStatus
    } & CommandBase)
  | ({ readonly type: 'moveUnit'; readonly unitId: EntityId; readonly to: Position } & CommandBase)
  | ({
      readonly type: 'moveUnits'
      readonly unitIds: readonly EntityId[]
      /** Translation commune ; une valeur négative déplace vers le haut ou la gauche. */
      readonly delta: Position
    } & CommandBase)
  | ({
      readonly type: 'updateUnit'
      readonly unitId: EntityId
      readonly changes: UnitEditableChanges
    } & CommandBase)
  | ({
      readonly type: 'updateUnits'
      readonly unitIds: readonly EntityId[]
      readonly changes: UnitEditableChanges
    } & CommandBase)
  | ({
      readonly type: 'changeUnitType'
      readonly unitId: EntityId
      readonly typeId: EntityId
      readonly resetAppearance?: boolean
    } & CommandBase)
  | ({ readonly type: 'removeUnit'; readonly unitId: EntityId } & CommandBase)
  | ({ readonly type: 'removeUnits'; readonly unitIds: readonly EntityId[] } & CommandBase)
  | ({
      readonly type: 'reachObjective'
      readonly unitId: EntityId
      readonly objectiveUnitId: EntityId
    } & CommandBase)
  | ({ readonly type: 'addAnnotation'; readonly annotation: BoardAnnotation } & CommandBase)
  | ({
      readonly type: 'updateAnnotation'
      readonly annotationId: EntityId
      readonly changes: AnnotationChanges
    } & CommandBase)
  | ({ readonly type: 'removeAnnotation'; readonly annotationId: EntityId } & CommandBase)
  | ({ readonly type: 'clearBoard' } & CommandBase)

export type Command = ScenarioCommand

export interface ResizeImpact {
  readonly unitIds: readonly EntityId[]
  readonly annotationIds: readonly EntityId[]
  readonly unitCount: number
  readonly annotationCount: number
}

export interface CommandEffects {
  readonly removedUnitIds: readonly EntityId[]
  readonly removedAnnotationIds: readonly EntityId[]
}

export interface CommandResult {
  readonly document: ScenarioDocumentV2
  readonly changed: boolean
  readonly effects: CommandEffects
}

export type DomainErrorCode =
  | 'INVALID_GRID_SIZE'
  | 'OUT_OF_BOUNDS'
  | 'CELL_OCCUPIED'
  | 'DUPLICATE_ID'
  | 'NOT_FOUND'
  | 'INVALID_REFERENCE'
  | 'LAST_FACTION'
  | 'RESIZE_CONFIRMATION_REQUIRED'
  | 'INVALID_ANNOTATION_UPDATE'
