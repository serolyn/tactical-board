/**
 * @packageDocumentation
 * Page routée du portfolio.
 *
 * Une page assemble plusieurs composants pour former un écran complet. Si tu
 * veux comprendre la structure d'une route comme l'accueil, le lab ou un détail,
 * lis ce fichier en premier.
 */

import { useParams } from 'react-router'
import { EntryHero } from '../components/PortfolioEntryHero'
import { EntrySections } from '../components/PortfolioEntrySections'
import { getPublishedLabBySlug, type LabEntry } from '../content/portfolioContent'
import { NotFoundPage } from './PortfolioNotFoundPage'
/**
 * Cette fonction intervient sur le sujet “lab Detail View” dans portfolio.
 *
 * Fichier: src/portfolio/pages/LabDetailPage.tsx
 * Si tu lis ce fichier pour apprendre, regarde d’abord LabDetailView dans LabDetailPage.tsx.
 */


export function LabDetailView({ entry }: { entry: LabEntry }) {
  const primaryAction = entry.slug === 'tactical-board'
    ? entry.links.find((link) => link.kind === 'internal' && link.href === '/board')
    : undefined
  const secondaryLinks = entry.links.filter((link) => link !== primaryAction)

  return (
    <article className={`editorial-page lab-detail lab-detail--${entry.slug}`}>
      <EntryHero
        cover={entry.cover}
        eyebrow={entry.overline}
        metadata={[
          { label: 'Statut', value: entry.status },
          { label: 'Type', value: entry.kind },
          { label: 'Année', value: String(entry.year) },
          { label: 'Technologies', value: entry.tags },
        ]}
        notice={entry.slug === 'tactical-board'
          ? 'Les données restent locales au navigateur.'
          : undefined}
        primaryAction={primaryAction}
        statement={entry.statement}
        summary={entry.summary}
        title={entry.title}
      />
      <EntrySections links={secondaryLinks} sections={entry.sections} />
    </article>
  )
}
/**
 * Cette fonction intervient sur le sujet “lab Detail Page” dans portfolio.
 *
 * Fichier: src/portfolio/pages/LabDetailPage.tsx
 * Si tu lis ce fichier pour apprendre, regarde d’abord LabDetailPage dans LabDetailPage.tsx.
 */


export function LabDetailPage() {
  const { slug = '' } = useParams()
  const entry = getPublishedLabBySlug(slug)
  return entry ? <LabDetailView entry={entry} /> : <NotFoundPage detail />
}

export default LabDetailPage
