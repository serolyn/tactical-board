import { z } from 'zod'
import {
  ARROW_STYLES,
  FACTION_ROLES,
  LEGACY_SCENARIO_FORMAT_VERSION,
  MARKER_TYPES,
  MAX_GRID_SIZE,
  MIN_GRID_SIZE,
  SCENARIO_FORMAT_VERSION,
  SCENARIO_STATUSES,
  UNIT_STATUSES,
} from './tacticalBoardTypes'

// Ces schémas décrivent le document durable, indépendamment de son transport JSON.
export const documentIdSchema = z.string().trim().min(1).max(200)
export const documentIsoDateSchema = z.string().refine(
  (value) => !Number.isNaN(Date.parse(value)),
  { message: 'Date invalide.' },
)

const shortTextSchema = z.string().max(500)
const nameSchema = z.string().trim().min(1).max(120)
const noteSchema = z.string().max(4_000)
const hexColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Couleur hexadécimale invalide.')
const positionSchema = z
  .object({ row: z.int().nonnegative(), column: z.int().nonnegative() })
  .strict()
const catalogIconSchema = z
  .object({ kind: z.literal('catalog'), name: documentIdSchema })
  .strict()
const assetIconSchema = z
  .object({ kind: z.literal('asset'), assetId: documentIdSchema })
  .strict()
const iconSchema = z.discriminatedUnion('kind', [catalogIconSchema, assetIconSchema])

const legacyFactionSchema = z
  .object({ id: documentIdSchema, name: nameSchema, color: hexColorSchema })
  .strict()

const factionSchema = legacyFactionSchema.extend({ role: z.enum(FACTION_ROLES) }).strict()

const customUnitTypeSchema = z
  .object({
    id: documentIdSchema,
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
    typeId: documentIdSchema,
    name: nameSchema,
    category: shortTextSchema,
    defaultColor: hexColorSchema,
    icon: iconSchema,
  })
  .strict()

const unitSchema = z
  .object({
    id: documentIdSchema,
    name: z.string().max(120),
    typeId: documentIdSchema,
    typeSnapshot: typeSnapshotSchema,
    factionId: documentIdSchema,
    color: hexColorSchema,
    icon: iconSchema,
    note: noteSchema,
    status: z.enum(UNIT_STATUSES),
    position: positionSchema,
  })
  .strict()

const arrowSchema = z
  .object({
    id: documentIdSchema,
    kind: z.literal('arrow'),
    start: positionSchema,
    end: positionSchema,
    color: hexColorSchema,
    style: z.enum(ARROW_STYLES),
  })
  .strict()

const markerSchema = z
  .object({
    id: documentIdSchema,
    kind: z.literal('marker'),
    position: positionSchema,
    color: hexColorSchema,
    markerType: z.enum(MARKER_TYPES),
    label: z.string().max(120),
  })
  .strict()

const annotationSchema = z.discriminatedUnion('kind', [arrowSchema, markerSchema])

const scenarioCoreSchema = {
  id: documentIdSchema,
  name: nameSchema,
  createdAt: documentIsoDateSchema,
  updatedAt: documentIsoDateSchema,
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
    start: documentIsoDateSchema.optional(),
    target: documentIsoDateSchema.optional(),
    current: documentIsoDateSchema.optional(),
  })
  .strict()

export const scenarioDocumentSchema = z
  .object({
    formatVersion: z.literal(SCENARIO_FORMAT_VERSION),
    ...scenarioCoreSchema,
    objective: z.string().max(500),
    period: periodSchema.optional(),
    status: z.enum(SCENARIO_STATUSES),
    previousScenarioId: documentIdSchema.optional(),
    factions: z.array(factionSchema).min(1).max(100),
  })
  .strict()
