/** Valide et remappe les paquets JSON échangés sans écriture partielle. */

import { z } from 'zod'
import {
  documentIdSchema,
  documentIsoDateSchema,
  legacyScenarioDocumentSchema,
  scenarioDocumentSchema,
} from '@/tactical-board/model/scenarioDocumentSchema'
import { migrateScenarioDocumentV1 } from '@/tactical-board/model/scenarioDocument'
import type {
  IconRef,
  LegacyScenarioDocumentV1,
  Position,
  ScenarioDocumentV1,
} from '@/tactical-board/model/tacticalBoardTypes'
import { BUILT_IN_UNIT_TYPE_BY_ID } from '@/tactical-board/model/unitCatalog'
import type { ImageAssetRecord } from '@/tactical-board/persistence/imageAssetRecord'
import {
  collectReferencedAssetIds,
  tacticalBoardRepository,
  type TacticalBoardRepository,
} from '@/tactical-board/persistence/tacticalBoardRepository'
import { base64ToBlob, blobToBase64, downloadJson, sanitizeFilename } from './fileDownloads'
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  MAX_IMAGE_DIMENSION,
  inspectImageBlob,
  normalizeImageFile,
  sanitizeSvg,
  validateImageBlob,
  type AcceptedImageType,
} from './imageAssets'

export const SCENARIO_EXPORT_KIND = 'tactical-board-scenario' as const
export const LEGACY_SCENARIO_EXPORT_VERSION = 1 as const
export const SCENARIO_EXPORT_VERSION = 2 as const
export const SCENARIO_COLLECTION_EXPORT_KIND = 'tactical-board-scenario-collection' as const
export const SCENARIO_COLLECTION_EXPORT_VERSION = 2 as const
export const MAX_IMPORT_JSON_BYTES = 32 * 1024 * 1024

const exportedAssetSchema = z
  .object({
    id: documentIdSchema,
    name: z.string().min(1).max(255),
    mimeType: z.enum(ACCEPTED_IMAGE_TYPES),
    width: z.int().positive().max(MAX_IMAGE_DIMENSION),
    height: z.int().positive().max(MAX_IMAGE_DIMENSION),
    createdAt: documentIsoDateSchema,
    data: z.string().min(1).max(Math.ceil((MAX_IMAGE_BYTES * 4) / 3) + 8),
  })
  .strict()

export const legacyScenarioExportSchema = z
  .object({
    kind: z.literal(SCENARIO_EXPORT_KIND),
    formatVersion: z.literal(LEGACY_SCENARIO_EXPORT_VERSION),
    exportedAt: documentIsoDateSchema,
    scenario: legacyScenarioDocumentSchema,
    assets: z.array(exportedAssetSchema),
  })
  .strict()

export const scenarioExportSchema = z
  .object({
    kind: z.literal(SCENARIO_EXPORT_KIND),
    formatVersion: z.literal(SCENARIO_EXPORT_VERSION),
    exportedAt: documentIsoDateSchema,
    scenario: scenarioDocumentSchema,
    assets: z.array(exportedAssetSchema),
  })
  .strict()

export const scenarioCollectionExportSchema = z
  .object({
    kind: z.literal(SCENARIO_COLLECTION_EXPORT_KIND),
    formatVersion: z.literal(SCENARIO_COLLECTION_EXPORT_VERSION),
    exportedAt: documentIsoDateSchema,
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

/** @deprecated Les nouveaux exports utilisent V2 ; conservé pour compatibilité source. */
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
  
/** Dépôt substituable, notamment pour les tests isolés. */
  repository?: TacticalBoardRepository
  
/** Nom résolu avant l'ouverture de la transaction atomique scénario/assets. */
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
  // Un import isolé ne peut garder un lien vers un scénario absent du paquet.
  // Un export de collection conserve en revanche les liens d'origine.
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

/** Assemble un export autonome avec les seules images référencées par le scénario. */
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

/** Assemble puis télécharge un scénario au format JSON versionné. */
export async function exportScenarioJson(
  scenario: ScenarioDocumentV1,
  repository: TacticalBoardRepository = tacticalBoardRepository,
): Promise<ScenarioExportV2> {
  const bundle = await createScenarioExport(scenario, repository)
  downloadJson(bundle, sanitizeFilename(scenario.name || 'scenario-tactique', 'json'))
  return bundle
}

/** Assemble une bibliothèque autonome en mutualisant ses assets référencés. */
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

/** Charge si nécessaire la bibliothèque puis déclenche son téléchargement. */
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

/** Valide et remappe entièrement un paquet en mémoire, sans aucune écriture. */
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

/** Persiste le scénario et ses assets atomiquement après la préparation complète. */
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
