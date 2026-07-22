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
  MetadataItem,
  MetadataSection,
  MusicEntry,
  PortfolioEntry,
  ProjectEntry,
  QuoteSection,
  SiteContent,
  SiteIdentity,
  TextSection,
} from './portfolioContentTypes'

/**
 * `published` sert d'interrupteur éditorial : une entrée peut rester dans son
 * fichier comme brouillon sans apparaître dans le site public.
 */
export function selectPublishedEntries<TEntry extends PortfolioEntry>(
  entries: readonly TEntry[],
): readonly TEntry[] {
  return entries.filter((entry) => entry.published)
}

export const publishedProjects = selectPublishedEntries(projects)
export const publishedMusic = selectPublishedEntries(music)
export const publishedLab = selectPublishedEntries(lab)

/** Recherche uniquement parmi les projets réellement visibles sur le site. */
export function getPublishedProjectBySlug(slug: string) {
  return publishedProjects.find((entry) => entry.slug === slug)
}

/** Recherche uniquement parmi les scènes musicales réellement visibles. */
export function getPublishedMusicBySlug(slug: string) {
  return publishedMusic.find((entry) => entry.slug === slug)
}

/** Recherche uniquement parmi les expériences Lab réellement visibles. */
export function getPublishedLabBySlug(slug: string) {
  return publishedLab.find((entry) => entry.slug === slug)
}
