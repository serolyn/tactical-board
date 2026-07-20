import type { ContentLink } from '../content'
import { ContentLinkAction } from './EntryLinks'
import { EntryMetadata, type MetadataItem } from './EntryMetadata'

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
