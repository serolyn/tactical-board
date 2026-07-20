import type {
  ContentImage,
  ContentLink,
  ContentSection,
  LabEntry,
  MusicEntry,
  PortfolioContent,
  PortfolioEntry,
  ProjectEntry,
} from './types'

export const reservedContentSlugs = [
  'about',
  'art-direction',
  'board',
  'lab',
  'music',
  'projects',
] as const

export type ContentCollectionName = keyof PortfolioContent

export type ContentValidationCode =
  | 'duplicate-section-id'
  | 'duplicate-slug'
  | 'invalid-link'
  | 'invalid-slug'
  | 'missing-field'
  | 'reserved-slug'

export type ContentValidationIssue = {
  readonly code: ContentValidationCode
  readonly collection: ContentCollectionName
  readonly slug: string
  readonly field: string
  readonly message: string
}

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const reservedSlugSet = new Set<string>(reservedContentSlugs)

function isBlank(value: string): boolean {
  return value.trim().length === 0
}

function addMissingField(
  issues: ContentValidationIssue[],
  collection: ContentCollectionName,
  slug: string,
  field: string,
) {
  issues.push({
    code: 'missing-field',
    collection,
    slug,
    field,
    message: `${collection}/${slug || '(sans slug)'} : le champ « ${field} » est obligatoire.`,
  })
}

function validateImage(
  image: ContentImage,
  field: string,
  collection: ContentCollectionName,
  slug: string,
  issues: ContentValidationIssue[],
) {
  if (isBlank(image.src)) addMissingField(issues, collection, slug, `${field}.src`)
  if (isBlank(image.alt)) addMissingField(issues, collection, slug, `${field}.alt`)
}

function isValidLink(link: ContentLink): boolean {
  if (isBlank(link.label) || isBlank(link.href)) return false

  if (link.kind === 'internal') {
    return link.href.startsWith('/') && !link.href.startsWith('//')
  }

  if (link.kind === 'static') {
    return !link.href.startsWith('/') && !link.href.includes('..')
  }

  try {
    const url = new URL(link.href)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

function validateLink(
  link: ContentLink,
  field: string,
  collection: ContentCollectionName,
  slug: string,
  issues: ContentValidationIssue[],
) {
  if (isValidLink(link)) return

  issues.push({
    code: 'invalid-link',
    collection,
    slug,
    field,
    message: `${collection}/${slug} : le lien « ${field} » ne correspond pas à son type.`,
  })
}

function validateSections(
  sections: readonly ContentSection[],
  collection: ContentCollectionName,
  slug: string,
  issues: ContentValidationIssue[],
) {
  const sectionIds = new Set<string>()

  for (const [index, section] of sections.entries()) {
    const field = `sections[${index}]`
    if (isBlank(section.id)) addMissingField(issues, collection, slug, `${field}.id`)
    if (sectionIds.has(section.id)) {
      issues.push({
        code: 'duplicate-section-id',
        collection,
        slug,
        field: `${field}.id`,
        message: `${collection}/${slug} : l’identifiant de section « ${section.id} » est dupliqué.`,
      })
    }
    sectionIds.add(section.id)

    switch (section.type) {
      case 'text':
        if (section.paragraphs.length === 0 || section.paragraphs.some(isBlank)) {
          addMissingField(issues, collection, slug, `${field}.paragraphs`)
        }
        break
      case 'image':
        validateImage(section.image, `${field}.image`, collection, slug, issues)
        break
      case 'quote':
        if (isBlank(section.quote)) addMissingField(issues, collection, slug, `${field}.quote`)
        break
      case 'metadata':
        if (
          section.items.length === 0 ||
          section.items.some((item) => isBlank(item.label) || isBlank(item.value))
        ) {
          addMissingField(issues, collection, slug, `${field}.items`)
        }
        break
      case 'link':
        validateLink(section.link, `${field}.link`, collection, slug, issues)
        break
    }
  }
}

function validateCommonFields(
  entry: PortfolioEntry,
  collection: ContentCollectionName,
  issues: ContentValidationIssue[],
) {
  const slug = entry.slug

  if (isBlank(slug)) addMissingField(issues, collection, slug, 'slug')
  if (!isBlank(slug) && !slugPattern.test(slug)) {
    issues.push({
      code: 'invalid-slug',
      collection,
      slug,
      field: 'slug',
      message: `${collection}/${slug} : utiliser uniquement des minuscules, chiffres et tirets simples.`,
    })
  }
  if (reservedSlugSet.has(slug)) {
    issues.push({
      code: 'reserved-slug',
      collection,
      slug,
      field: 'slug',
      message: `${collection}/${slug} : ce slug est réservé par le routeur.`,
    })
  }
  if (isBlank(entry.title)) addMissingField(issues, collection, slug, 'title')
  if (isBlank(entry.status)) addMissingField(issues, collection, slug, 'status')
  if (isBlank(entry.summary)) addMissingField(issues, collection, slug, 'summary')
  if (!Number.isInteger(entry.year) || entry.year <= 0) {
    addMissingField(issues, collection, slug, 'year')
  }

  validateSections(entry.sections, collection, slug, issues)
}

function validateProject(
  entry: ProjectEntry,
  collection: 'projects',
  issues: ContentValidationIssue[],
) {
  validateCommonFields(entry, collection, issues)
  if (isBlank(entry.introduction)) addMissingField(issues, collection, entry.slug, 'introduction')
  validateImage(entry.cover, 'cover', collection, entry.slug, issues)
  entry.links.forEach((link, index) =>
    validateLink(link, `links[${index}]`, collection, entry.slug, issues),
  )
}

function validateMusic(
  entry: MusicEntry,
  collection: 'music',
  issues: ContentValidationIssue[],
) {
  validateCommonFields(entry, collection, issues)
  if (entry.published && entry.artwork === null) {
    addMissingField(issues, collection, entry.slug, 'artwork')
  } else if (entry.artwork !== null) {
    validateImage(entry.artwork, 'artwork', collection, entry.slug, issues)
  }
  entry.links.forEach((link, index) =>
    validateLink(link, `links[${index}]`, collection, entry.slug, issues),
  )
}

function validateLab(entry: LabEntry, collection: 'lab', issues: ContentValidationIssue[]) {
  validateCommonFields(entry, collection, issues)
  if (isBlank(entry.overline)) addMissingField(issues, collection, entry.slug, 'overline')
  if (isBlank(entry.kind)) addMissingField(issues, collection, entry.slug, 'kind')
  validateImage(entry.cover, 'cover', collection, entry.slug, issues)
  entry.links.forEach((link, index) =>
    validateLink(link, `links[${index}]`, collection, entry.slug, issues),
  )
}

/** Valide un catalogue complet sans mutation ni accès aux API du navigateur. */
export function validatePortfolioContent(content: PortfolioContent): readonly ContentValidationIssue[] {
  const issues: ContentValidationIssue[] = []
  const knownSlugs = new Map<string, ContentCollectionName>()

  const rememberSlug = (collection: ContentCollectionName, slug: string) => {
    const firstCollection = knownSlugs.get(slug)
    if (firstCollection !== undefined) {
      issues.push({
        code: 'duplicate-slug',
        collection,
        slug,
        field: 'slug',
        message: `${collection}/${slug} : ce slug existe déjà dans « ${firstCollection} »; les slugs sont uniques dans tout le portfolio.`,
      })
      return
    }
    knownSlugs.set(slug, collection)
  }

  for (const entry of content.projects) {
    rememberSlug('projects', entry.slug)
    validateProject(entry, 'projects', issues)
  }
  for (const entry of content.music) {
    rememberSlug('music', entry.slug)
    validateMusic(entry, 'music', issues)
  }
  for (const entry of content.lab) {
    rememberSlug('lab', entry.slug)
    validateLab(entry, 'lab', issues)
  }

  return issues
}

export class PortfolioContentError extends Error {
  readonly issues: readonly ContentValidationIssue[]

  constructor(issues: readonly ContentValidationIssue[]) {
    super(`Contenu portfolio invalide :\n${issues.map((issue) => `- ${issue.message}`).join('\n')}`)
    this.name = 'PortfolioContentError'
    this.issues = issues
  }
}

/** Échoue tôt en développement ou au build pour éviter de publier un contenu invalide. */
export function assertValidPortfolioContent(content: PortfolioContent): void {
  const issues = validatePortfolioContent(content)
  if (issues.length > 0) throw new PortfolioContentError(issues)
}
