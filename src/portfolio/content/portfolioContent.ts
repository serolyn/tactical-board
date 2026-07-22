import { lab } from './portfolioLabEntries'
import { music } from './portfolioMusicEntries'
import { projects } from './portfolioProjectEntries'
import type { PortfolioEntry } from './portfolioContentTypes'

export { lab } from './portfolioLabEntries'
export { music } from './portfolioMusicEntries'
export { projects } from './portfolioProjectEntries'
export { siteContent } from './portfolioSiteContent'
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
} from './portfolioContentTypes'

export const portfolioContent = { projects, music, lab }

/** Extrait les entrées qui doivent être visibles sur le site. */
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
