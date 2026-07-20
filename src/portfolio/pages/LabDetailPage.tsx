import { useParams } from 'react-router'
import { EntryHero } from '../components/EntryHero'
import { EntrySections } from '../components/EntrySections'
import { getPublishedLabBySlug, type LabEntry } from '../content'
import { NotFoundPage } from './NotFoundPage'

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

export function LabDetailPage() {
  const { slug = '' } = useParams()
  const entry = getPublishedLabBySlug(slug)
  return entry ? <LabDetailView entry={entry} /> : <NotFoundPage detail />
}

export default LabDetailPage
