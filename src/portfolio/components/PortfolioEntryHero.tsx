/**
 * @packageDocumentation
 * Composant visuel réutilisable du portfolio.
 *
 * Ce fichier découpe l'interface en une petite pièce lisible: en-tête, carte,
 * section, indice ou bloc de liens. Si tu veux modifier ce que l'utilisateur
 * voit à l'écran, c'est souvent ici qu'il faut commencer.
 */

import type { ContentLink } from '../content/portfolioContentTypes'
import { ContentLinkAction } from './PortfolioEntryLinks'
import { EntryMetadata, type MetadataItem } from './PortfolioEntryMetadata'

interface EntryHeroProps {
  eyebrow: string
  title: string
  summary: string
  statement?: string
  cover?: {
    src: string
    alt: string
  }
  metadata: readonly MetadataItem[]
  primaryAction?: ContentLink
  notice?: string
}
/**
 * Cette fonction intervient sur le sujet “entry Hero” dans portfolio.
 *
 * Fichier: src/portfolio/components/EntryHero.tsx
 * Si tu lis ce fichier pour apprendre, regarde d’abord EntryHero dans EntryHero.tsx.
 */


export function EntryHero({
  eyebrow,
  title,
  summary,
  statement,
  cover,
  metadata,
  primaryAction,
  notice,
}: EntryHeroProps) {
  return (
    <header className="entry-hero">
      <div className="entry-hero__visual">
        {cover ? <img alt={cover.alt} decoding="async" src={cover.src} /> : null}
      </div>

      <div className="entry-hero__copy">
        <p className="portfolio-meta">{eyebrow}</p>
        <h1 tabIndex={-1}>{title}</h1>
        {statement ? <p className="portfolio-ghost entry-hero__statement">{statement}</p> : null}
        <p className="entry-hero__summary">{summary}</p>

        {primaryAction ? (
          <ContentLinkAction link={primaryAction} primary />
        ) : null}

        {notice ? <p className="entry-hero__notice">{notice}</p> : null}
      </div>

      <EntryMetadata items={metadata} />
    </header>
  )
}
