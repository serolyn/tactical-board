import { lab } from './lab'
import { music } from './music'
import { projects } from './projects'
import type { PortfolioEntry } from './types'
import { assertValidPortfolioContent } from './validation'

export { lab } from './lab'
export { music } from './music'
export { projects } from './projects'
export { siteContent } from './site'
export type {
  ContentCredit,
  ContentImage,
  ContentLink,
  ContentLinkKind,
  ContentSection,
  EntryStatus,
  ImageSection,
  LabEntry,
  LabKind,
  LinkSection,
  MetadataItem,
  MetadataSection,
  MusicEntry,
  PortfolioContent,
  PortfolioEntry,
  ProjectEntry,
  QuoteSection,
  SiteContent,
  SiteIdentity,
  TextSection,
} from './types'
export {
  assertValidPortfolioContent,
  PortfolioContentError,
  reservedContentSlugs,
  validatePortfolioContent,
} from './validation'
export type {
  ContentCollectionName,
  ContentValidationCode,
  ContentValidationIssue,
} from './validation'

export const portfolioContent = { projects, music, lab }

/** The only selector used to turn authoring arrays into public collections. */
export function selectPublishedEntries<TEntry extends PortfolioEntry>(
  entries: readonly TEntry[],
): readonly TEntry[] {
  return entries.filter((entry) => entry.published)
}

export const publishedProjects = selectPublishedEntries(projects)
export const publishedMusic = selectPublishedEntries(music)
export const publishedLab = selectPublishedEntries(lab)

export function getPublishedProjectBySlug(slug: string) {
  return publishedProjects.find((entry) => entry.slug === slug)
}

export function getPublishedMusicBySlug(slug: string) {
  return publishedMusic.find((entry) => entry.slug === slug)
}

export function getPublishedLabBySlug(slug: string) {
  return publishedLab.find((entry) => entry.slug === slug)
}

// Importing the content index validates the authoring files during app startup and build.
assertValidPortfolioContent(portfolioContent)
