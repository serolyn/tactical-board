/**
 * @packageDocumentation
 * Données éditoriales du portfolio.
 *
 * Ce fichier contient le texte publié, pas la mise en page. C'est ici que tu
 * modifies les titres, résumés, listes et règles de validation du contenu.
 */

/** API publique du contenu : valide les sources puis expose uniquement les entrées publiées. */
import { lab } from './portfolioLabEntries'
import { music } from './portfolioMusicEntries'
import { projects } from './portfolioProjectEntries'
import type { PortfolioEntry } from './portfolioContentTypes'
import { assertValidPortfolioContent } from './portfolioContentValidation'

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
export {
  assertValidPortfolioContent,
  PortfolioContentError,
  reservedContentSlugs,
  validatePortfolioContent,
} from './portfolioContentValidation'
export type {
  ContentCollectionName,
  ContentValidationCode,
  ContentValidationIssue,
} from './portfolioContentValidation'

export const portfolioContent = { projects, music, lab }

/** Sélecteur unique qui transforme les tableaux éditoriaux en collections publiques. */
export function selectPublishedEntries<TEntry extends PortfolioEntry>(
  entries: readonly TEntry[],
): readonly TEntry[] {
  return entries.filter((entry) => entry.published)
}

export const publishedProjects = selectPublishedEntries(projects)
export const publishedMusic = selectPublishedEntries(music)
export const publishedLab = selectPublishedEntries(lab)
/**
 * Cette fonction intervient sur le sujet “get Published Project By Slug” dans portfolio.
 *
 * Fichier: src/portfolio/content/index.ts
 * Si tu lis ce fichier pour apprendre, regarde d’abord getPublishedProjectBySlug dans index.ts.
 */


export function getPublishedProjectBySlug(slug: string) {
  return publishedProjects.find((entry) => entry.slug === slug)
}
/**
 * Cette fonction intervient sur le sujet “get Published Music By Slug” dans portfolio.
 *
 * Fichier: src/portfolio/content/index.ts
 * Si tu lis ce fichier pour apprendre, regarde d’abord getPublishedMusicBySlug dans index.ts.
 */


export function getPublishedMusicBySlug(slug: string) {
  return publishedMusic.find((entry) => entry.slug === slug)
}
/**
 * Cette fonction intervient sur le sujet “get Published Lab By Slug” dans portfolio.
 *
 * Fichier: src/portfolio/content/index.ts
 * Si tu lis ce fichier pour apprendre, regarde d’abord getPublishedLabBySlug dans index.ts.
 */


export function getPublishedLabBySlug(slug: string) {
  return publishedLab.find((entry) => entry.slug === slug)
}

// L'import de cet index valide les contenus au démarrage et pendant le build.
assertValidPortfolioContent(portfolioContent)
