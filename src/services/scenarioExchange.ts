import { z } from 'zod'
import {
  ARROW_STYLES,
  BUILT_IN_UNIT_TYPE_BY_ID,
  FACTION_ROLES,
  LEGACY_SCENARIO_FORMAT_VERSION,
  MARKER_TYPES,
  MAX_GRID_SIZE,
  MIN_GRID_SIZE,
  SCENARIO_FORMAT_VERSION,
  SCENARIO_STATUSES,
  UNIT_STATUSES,
  migrateScenarioDocumentV1,
  type IconRef,
  type LegacyScenarioDocumentV1,
  type Position,
  type ScenarioDocumentV1,
} from '../domain'
import { base64ToBlob, blobToBase64, downloadJson, sanitizeFilename } from './downloads'
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  MAX_IMAGE_DIMENSION,
  inspectImageBlob,
  normalizeImageFile,
  sanitizeSvg,
  validateImageBlob,
  type AcceptedImageType,
  type ImageAssetRecord,
} from './imageAssets'
import {
  collectReferencedAssetIds,
  tacticalBoardRepository,
  type TacticalBoardRepository,
} from './repository'

export const SCENARIO_EXPORT_KIND = 'tactical-board-scenario' as const
export const LEGACY_SCENARIO_EXPORT_VERSION = 1 as const
export const SCENARIO_EXPORT_VERSION = 2 as const
export const SCENARIO_COLLECTION_EXPORT_KIND = 'tactical-board-scenario-collection' as const
export const SCENARIO_COLLECTION_EXPORT_VERSION = 2 as const
export const MAX_IMPORT_JSON_BYTES = 32 * 1024 * 1024

const idSchema = z.string().trim().min(1).max(200)
const shortTextSchema = z.string().max(500)
const nameSchema = z.string().trim().min(1).max(120)
const noteSchema = z.string().max(4_000)
const hexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Couleur hexadécimale invalide.')
const isoDateSchema = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: 'Date invalide.',
})
const positionSchema = z.object({ row: z.int().nonnegative(), column: z.int().nonnegative() }).strict()
const catalogIconSchema = z.object({ kind: z.literal('catalog'), name: idSchema }).strict()
const assetIconSchema = z.object({ kind: z.literal('asset'), assetId: idSchema }).strict()
const iconSchema = z.discriminatedUnion('kind', [catalogIconSchema, assetIconSchema])

const legacyFactionSchema = z
  .object({ id: idSchema, name: nameSchema, color: hexColorSchema })
  .strict()

const factionSchema = legacyFactionSchema.extend({ role: z.enum(FACTION_ROLES) }).strict()

const customUnitTypeSchema = z
  .object({
    id: idSchema,
    name: nameSchema,
    category: shortTextSchema,
    defaultColor: hexColorSchema,
    icon: iconSchema,
    builtin: z.literal(false),
    archived: z.boolean(),
  })
  .strict()

const typeSnapshotSchema = z
  .object({
    typeId: idSchema,
    name: nameSchema,
    category: shortTextSchema,
    defaultColor: hexColorSchema,
    icon: iconSchema,
  })
  .strict()

const unitSchema = z
  .object({
    id: idSchema,
    name: z.string().max(120),
    typeId: idSchema,
    typeSnapshot: typeSnapshotSchema,
    factionId: idSchema,
    color: hexColorSchema,
    icon: iconSchema,
    note: noteSchema,
    status: z.enum(UNIT_STATUSES),
    position: positionSchema,
  })
  .strict()

const arrowSchema = z
  .object({
    id: idSchema,
    kind: z.literal('arrow'),
    start: positionSchema,
    end: positionSchema,
    color: hexColorSchema,
    style: z.enum(ARROW_STYLES),
  })
  .strict()

const markerSchema = z
  .object({
    id: idSchema,
    kind: z.literal('marker'),
    position: positionSchema,
    color: hexColorSchema,
    markerType: z.enum(MARKER_TYPES),
    label: z.string().max(120),
  })
  .strict()

const annotationSchema = z.discriminatedUnion('kind', [arrowSchema, markerSchema])

const scenarioCoreSchema = {
  id: idSchema,
  name: nameSchema,
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
  grid: z
    .object({
      rows: z.int().min(MIN_GRID_SIZE).max(MAX_GRID_SIZE),
      columns: z.int().min(MIN_GRID_SIZE).max(MAX_GRID_SIZE),
      showCoordinates: z.boolean(),
    })
    .strict(),
  customUnitTypes: z.array(customUnitTypeSchema).max(500),
  units: z.array(unitSchema).max(MAX_GRID_SIZE * MAX_GRID_SIZE),
  annotations: z.array(annotationSchema).max(2_000),
} as const

export const legacyScenarioDocumentSchema = z
  .object({
    formatVersion: z.literal(LEGACY_SCENARIO_FORMAT_VERSION),
    ...scenarioCoreSchema,
    factions: z.array(legacyFactionSchema).min(1).max(100),
  })
  .strict()

const periodSchema = z
  .object({
    start: isoDateSchema.optional(),
    target: isoDateSchema.optional(),
    current: isoDateSchema.optional(),
  })
  .strict()

export const scenarioDocumentSchema = z
  .object({
    formatVersion: z.literal(SCENARIO_FORMAT_VERSION),
    ...scenarioCoreSchema,
    objective: z.string().max(500),
    period: periodSchema.optional(),
    status: z.enum(SCENARIO_STATUSES),
    previousScenarioId: idSchema.optional(),
    factions: z.array(factionSchema).min(1).max(100),
  })
  .strict()

const exportedAssetSchema = z
  .object({
    id: idSchema,
    name: z.string().min(1).max(255),
    mimeType: z.enum(ACCEPTED_IMAGE_TYPES),
    width: z.int().positive().max(MAX_IMAGE_DIMENSION),
    height: z.int().positive().max(MAX_IMAGE_DIMENSION),
    createdAt: isoDateSchema,
    data: z.string().min(1).max(Math.ceil((MAX_IMAGE_BYTES * 4) / 3) + 8),
  })
  .strict()

export const legacyScenarioExportSchema = z
  .object({
    kind: z.literal(SCENARIO_EXPORT_KIND),
    formatVersion: z.literal(LEGACY_SCENARIO_EXPORT_VERSION),
    exportedAt: isoDateSchema,
    scenario: legacyScenarioDocumentSchema,
    assets: z.array(exportedAssetSchema),
  })
  .strict()

export const scenarioExportSchema = z
  .object({
    kind: z.literal(SCENARIO_EXPORT_KIND),
    formatVersion: z.literal(SCENARIO_EXPORT_VERSION),
    exportedAt: isoDateSchema,
    scenario: scenarioDocumentSchema,
    assets: z.array(exportedAssetSchema),
  })
  .strict()

export const scenarioCollectionExportSchema = z
  .object({
    kind: z.literal(SCENARIO_COLLECTION_EXPORT_KIND),
    formatVersion: z.literal(SCENARIO_COLLECTION_EXPORT_VERSION),
    exportedAt: isoDateSchema,
    scenarios: z.array(scenarioDocumentSchema),
    assets: z.array(exportedAssetSchema),
  })
  .strict()

export type ExportedImageAssetV1 = z.infer<typeof exportedAssetSchema>

export interface LegacyScenarioExportV1 {
  readonly kind: typeof SCENARIO_EXPORT_KIND
  readonly formatVersion: typeof LEGACY_SCENARIO_EXPORT_VERSION
  readonly exportedAt: string
  readonly scenario: LegacyScenarioDocumentV1
  readonly assets: readonly ExportedImageAssetV1[]
}

export interface ScenarioExportV2 {
  readonly kind: typeof SCENARIO_EXPORT_KIND
  readonly formatVersion: typeof SCENARIO_EXPORT_VERSION
  readonly exportedAt: string
  readonly scenario: ScenarioDocumentV1
  readonly assets: readonly ExportedImageAssetV1[]
}

/** @deprecated New exports use format V2; kept for source compatibility. */
export type ScenarioExportV1 = ScenarioExportV2

export interface ScenarioCollectionExportV2 {
  readonly kind: typeof SCENARIO_COLLECTION_EXPORT_KIND
  readonly formatVersion: typeof SCENARIO_COLLECTION_EXPORT_VERSION
  readonly exportedAt: string
  readonly scenarios: readonly ScenarioDocumentV1[]
  readonly assets: readonly ExportedImageAssetV1[]
}

export interface PreparedScenarioImport {
  scenario: ScenarioDocumentV1
  assets: ImageAssetRecord[]
}

export interface ImportScenarioOptions {
  /** Repository override, primarily useful for isolated tests. */
  repository?: TacticalBoardRepository
  /** Resolved before the single scenario/assets transaction is opened. */
  overrideName?: string | ((sourceName: string) => string)
}

export class ScenarioImportError extends Error {
  readonly issues: readonly string[]

  constructor(message: string, issues: readonly string[] = []) {
    super(message)
    this.name = 'ScenarioImportError'
    this.issues = issues
  }
}

function assertUniqueIds(
  entries: readonly { id: string }[],
  label: string,
  issues: string[],
): void {
  const seen = new Set<string>()
  for (const entry of entries) {
    if (seen.has(entry.id)) issues.push(`${label} : identifiant dupliqué « ${entry.id} ».`)
    seen.add(entry.id)
  }
}

function isInside(position: Position, rows: number, columns: number): boolean {
  return (
    position.row >= 0 &&
    position.row < rows &&
    position.column >= 0 &&
    position.column < columns
  )
}

function collectIconAssetId(icon: IconRef, target: Set<string>): void {
  if (icon.kind === 'asset') target.add(icon.assetId)
}

function validateScenarioReferences(
  scenario: ScenarioDocumentV1,
  availableAssetIds: ReadonlySet<string>,
): void {
  const issues: string[] = []
  assertUniqueIds(scenario.factions, 'Faction', issues)
  assertUniqueIds(scenario.customUnitTypes, 'Type personnalisé', issues)
  assertUniqueIds(scenario.units, 'Unité', issues)
  assertUniqueIds(scenario.annotations, 'Annotation', issues)

  const factionIds = new Set(scenario.factions.map((faction) => faction.id))
  const customTypeIds = new Set(scenario.customUnitTypes.map((unitType) => unitType.id))
  const referencedAssets = new Set<string>()
  const occupiedCells = new Set<string>()

  for (const unitType of scenario.customUnitTypes) {
    if (BUILT_IN_UNIT_TYPE_BY_ID.has(unitType.id)) {
      issues.push(`Le type personnalisé « ${unitType.id} » masque un type intégré.`)
    }
    collectIconAssetId(unitType.icon, referencedAssets)
  }

  for (const unit of scenario.units) {
    if (!factionIds.has(unit.factionId)) {
      issues.push(`L’unité « ${unit.id} » référence une faction absente.`)
    }
    if (!customTypeIds.has(unit.typeId) && !BUILT_IN_UNIT_TYPE_BY_ID.has(unit.typeId)) {
      issues.push(`L’unité « ${unit.id} » référence un type absent.`)
    }
    if (unit.typeSnapshot.typeId !== unit.typeId) {
      issues.push(`Le snapshot de type de l’unité « ${unit.id} » est incohérent.`)
    }
    if (!isInside(unit.position, scenario.grid.rows, scenario.grid.columns)) {
      issues.push(`L’unité « ${unit.id} » se trouve hors du plateau.`)
    }

    const cell = `${unit.position.row}:${unit.position.column}`
    if (occupiedCells.has(cell)) issues.push(`Plusieurs unités occupent la case ${cell}.`)
    occupiedCells.add(cell)
    collectIconAssetId(unit.icon, referencedAssets)
    collectIconAssetId(unit.typeSnapshot.icon, referencedAssets)
  }

  for (const annotation of scenario.annotations) {
    const positions =
      annotation.kind === 'arrow' ? [annotation.start, annotation.end] : [annotation.position]
    if (positions.some((position) => !isInside(position, scenario.grid.rows, scenario.grid.columns))) {
      issues.push(`L’annotation « ${annotation.id} » se trouve hors du plateau.`)
    }
  }

  for (const assetId of referencedAssets) {
    if (!availableAssetIds.has(assetId)) {
      issues.push(`L’image « ${assetId} » référencée par le scénario est absente.`)
    }
  }

  if (issues.length) {
    throw new ScenarioImportError('Le scénario contient des références invalides.', issues)
  }
}

function makeIdMap(ids: readonly string[]): Map<string, string> {
  return new Map(ids.map((id) => [id, crypto.randomUUID()]))
}

function remapIcon(icon: IconRef, assetIds: ReadonlyMap<string, string>): IconRef {
  return icon.kind === 'asset'
    ? { kind: 'asset', assetId: assetIds.get(icon.assetId) ?? icon.assetId }
    : icon
}

function remapScenario(
  source: ScenarioDocumentV1,
  assetIds: ReadonlyMap<string, string>,
): ScenarioDocumentV1 {
  // A single-scenario import cannot safely retain a link to a scenario that is
  // not part of the bundle. Collection export keeps the original links intact.
  const { previousScenarioId: _previousScenarioId, ...sourceWithoutPreviousLink } = source
  const factionIds = makeIdMap(source.factions.map((entry) => entry.id))
  const typeIds = makeIdMap(source.customUnitTypes.map((entry) => entry.id))
  const now = new Date().toISOString()

  return {
    ...sourceWithoutPreviousLink,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    factions: source.factions.map((faction) => ({
      ...faction,
      id: factionIds.get(faction.id)!,
    })),
    customUnitTypes: source.customUnitTypes.map((unitType) => ({
      ...unitType,
      id: typeIds.get(unitType.id)!,
      icon: remapIcon(unitType.icon, assetIds),
    })),
    units: source.units.map((unit) => {
      const typeId = typeIds.get(unit.typeId) ?? unit.typeId
      return {
        ...unit,
        id: crypto.randomUUID(),
        factionId: factionIds.get(unit.factionId)!,
        typeId,
        icon: remapIcon(unit.icon, assetIds),
        typeSnapshot: {
          ...unit.typeSnapshot,
          typeId,
          icon: remapIcon(unit.typeSnapshot.icon, assetIds),
        },
      }
    }),
    annotations: source.annotations.map((annotation) => ({
      ...annotation,
      id: crypto.randomUUID(),
    })),
  }
}

function formatZodIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const location = issue.path.length ? issue.path.join('.') : 'fichier'
    return `${location} : ${issue.message}`
  })
}

async function sourceToValue(source: string | Blob | unknown): Promise<unknown> {
  if (source instanceof Blob) {
    if (source.size > MAX_IMPORT_JSON_BYTES) {
      throw new ScenarioImportError('Le fichier JSON dépasse la limite de 32 Mio.')
    }
    source = await source.text()
  }

  if (typeof source !== 'string') return source
  if (new Blob([source]).size > MAX_IMPORT_JSON_BYTES) {
    throw new ScenarioImportError('Le fichier JSON dépasse la limite de 32 Mio.')
  }

  try {
    return JSON.parse(source) as unknown
  } catch {
    throw new ScenarioImportError('Le fichier sélectionné n’est pas un JSON valide.')
  }
}

async function createExportedAssets(
  scenarios: readonly ScenarioDocumentV1[],
  repository: TacticalBoardRepository = tacticalBoardRepository,
): Promise<ExportedImageAssetV1[]> {
  const referencedAssetIds = new Set<string>()
  for (const scenario of scenarios) {
    for (const id of collectReferencedAssetIds(scenario)) referencedAssetIds.add(id)
  }

  return Promise.all(
    Array.from(referencedAssetIds).map(async (id) => {
      const asset = await repository.getAsset(id)
      if (!asset) throw new Error(`L’image « ${id} » est introuvable et ne peut pas être exportée.`)
      const detectedType = await validateImageBlob(asset.blob, asset.mimeType)
      const inspected = await inspectImageBlob(asset.blob, detectedType)
      if (inspected.width !== asset.width || inspected.height !== asset.height) {
        throw new Error(`Les dimensions enregistrées pour l’image « ${id} » sont incohérentes.`)
      }
      return {
        id: asset.id,
        name: asset.name,
        mimeType: asset.mimeType as AcceptedImageType,
        width: asset.width,
        height: asset.height,
        createdAt: asset.createdAt,
        data: await blobToBase64(asset.blob),
      }
    }),
  )
}

export async function createScenarioExport(
  scenario: ScenarioDocumentV1,
  repository: TacticalBoardRepository = tacticalBoardRepository,
): Promise<ScenarioExportV2> {
  const assets = await createExportedAssets([scenario], repository)

  const bundle: ScenarioExportV2 = {
    kind: SCENARIO_EXPORT_KIND,
    formatVersion: SCENARIO_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    scenario,
    assets,
  }
  const checked = scenarioExportSchema.safeParse(bundle)
  if (!checked.success) {
    throw new Error(`Le scénario ne peut pas être exporté : ${formatZodIssues(checked.error).join(' ')}`)
  }
  return checked.data
}

export async function exportScenarioJson(
  scenario: ScenarioDocumentV1,
  repository: TacticalBoardRepository = tacticalBoardRepository,
): Promise<ScenarioExportV2> {
  const bundle = await createScenarioExport(scenario, repository)
  downloadJson(bundle, sanitizeFilename(scenario.name || 'scenario-tactique', 'json'))
  return bundle
}

export async function createAllScenariosExport(
  scenarios: readonly ScenarioDocumentV1[],
  repository: TacticalBoardRepository = tacticalBoardRepository,
): Promise<ScenarioCollectionExportV2> {
  const ids = new Set<string>()
  for (const scenario of scenarios) {
    if (ids.has(scenario.id)) {
      throw new Error(`Le scénario « ${scenario.id} » apparaît plusieurs fois dans la bibliothèque.`)
    }
    ids.add(scenario.id)
  }

  const assets = await createExportedAssets(scenarios, repository)
  const bundle: ScenarioCollectionExportV2 = {
    kind: SCENARIO_COLLECTION_EXPORT_KIND,
    formatVersion: SCENARIO_COLLECTION_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    scenarios,
    assets,
  }
  const checked = scenarioCollectionExportSchema.safeParse(bundle)
  if (!checked.success) {
    throw new Error(
      `La bibliothèque ne peut pas être exportée : ${formatZodIssues(checked.error).join(' ')}`,
    )
  }
  return checked.data
}

export async function exportAllScenariosJson(
  scenarios?: readonly ScenarioDocumentV1[],
  repository: TacticalBoardRepository = tacticalBoardRepository,
): Promise<ScenarioCollectionExportV2> {
  const source = scenarios ?? await repository.listScenarios()
  const bundle = await createAllScenariosExport(source, repository)
  const date = new Date().toISOString().slice(0, 10)
  downloadJson(bundle, `tactical-board-scenarios-${date}.json`)
  return bundle
}

export async function prepareScenarioImport(
  source: string | Blob | unknown,
): Promise<PreparedScenarioImport> {
  const value = await sourceToValue(source)
  const header = z
    .object({ kind: z.literal(SCENARIO_EXPORT_KIND), formatVersion: z.number() })
    .safeParse(value)
  if (!header.success) {
    throw new ScenarioImportError(
      'Le fichier ne respecte pas le format Tactical Board.',
      formatZodIssues(header.error),
    )
  }

  let scenario: ScenarioDocumentV1
  let exportedAssets: readonly ExportedImageAssetV1[]
  if (header.data.formatVersion === LEGACY_SCENARIO_EXPORT_VERSION) {
    const parsed = legacyScenarioExportSchema.safeParse(value)
    if (!parsed.success) {
      throw new ScenarioImportError(
        'L’export Tactical Board V1 est invalide.',
        formatZodIssues(parsed.error),
      )
    }
    scenario = migrateScenarioDocumentV1(parsed.data.scenario as LegacyScenarioDocumentV1)
    exportedAssets = parsed.data.assets
  } else if (header.data.formatVersion === SCENARIO_EXPORT_VERSION) {
    const parsed = scenarioExportSchema.safeParse(value)
    if (!parsed.success) {
      throw new ScenarioImportError(
        'L’export Tactical Board V2 est invalide.',
        formatZodIssues(parsed.error),
      )
    }
    scenario = parsed.data.scenario as ScenarioDocumentV1
    exportedAssets = parsed.data.assets
  } else {
    throw new ScenarioImportError(
      `La version d’export ${header.data.formatVersion} n’est pas prise en charge.`,
    )
  }

  const migratedCheck = scenarioDocumentSchema.safeParse(scenario)
  if (!migratedCheck.success) {
    throw new ScenarioImportError(
      'Le scénario migré ne respecte pas le format Tactical Board V2.',
      formatZodIssues(migratedCheck.error),
    )
  }
  scenario = migratedCheck.data as ScenarioDocumentV1

  const assetIds = new Set(exportedAssets.map((asset) => asset.id))
  if (assetIds.size !== exportedAssets.length) {
    throw new ScenarioImportError('Le fichier contient des identifiants d’image dupliqués.')
  }
  validateScenarioReferences(scenario, assetIds)

  const referencedIds = collectReferencedAssetIds(scenario)
  const referencedExportedAssets = exportedAssets.filter((asset) => referencedIds.has(asset.id))
  const remappedAssetIds = makeIdMap(referencedExportedAssets.map((asset) => asset.id))
  const assets: ImageAssetRecord[] = []

  for (const exported of referencedExportedAssets) {
    let blob = base64ToBlob(exported.data, exported.mimeType)
    let mimeType = await validateImageBlob(blob, exported.mimeType)
    const inspected = await inspectImageBlob(blob, mimeType)
    if (inspected.width !== exported.width || inspected.height !== exported.height) {
      throw new ScenarioImportError(`Les dimensions déclarées pour l’image « ${exported.id} » sont invalides.`)
    }

    let width = exported.width
    let height = exported.height
    if (mimeType === 'image/svg+xml') {
      const sanitized = new Blob([sanitizeSvg(await blob.text())], { type: 'image/svg+xml' })
      const normalized = await normalizeImageFile(
        new File([sanitized], exported.name, { type: 'image/svg+xml' }),
      )
      blob = normalized.blob
      mimeType = normalized.mimeType
      width = normalized.width
      height = normalized.height
    }
    assets.push({
      id: remappedAssetIds.get(exported.id)!,
      blob,
      mimeType,
      name: exported.name,
      width,
      height,
      createdAt: new Date().toISOString(),
    })
  }

  return { scenario: remapScenario(scenario, remappedAssetIds), assets }
}

export async function importScenario(
  source: string | Blob | unknown,
  options: ImportScenarioOptions = {},
): Promise<ScenarioDocumentV1> {
  const prepared = await prepareScenarioImport(source)
  const requestedName =
    typeof options.overrideName === 'function'
      ? options.overrideName(prepared.scenario.name)
      : options.overrideName
  const scenario = requestedName === undefined
    ? prepared.scenario
    : {
        ...prepared.scenario,
        name: requestedName.trim(),
        updatedAt: new Date().toISOString(),
      }

  const checked = scenarioDocumentSchema.safeParse(scenario)
  if (!checked.success) {
    throw new ScenarioImportError(
      'Le nom final du scénario importé est invalide.',
      formatZodIssues(checked.error),
    )
  }

  await (options.repository ?? tacticalBoardRepository).saveScenarioWithAssets(
    scenario,
    prepared.assets,
  )
  return scenario
}
