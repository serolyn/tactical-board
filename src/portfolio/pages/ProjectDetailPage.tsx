import { useParams } from 'react-router'
import { EntryHero } from '../components/EntryHero'
import { EntrySections } from '../components/EntrySections'
import { getPublishedProjectBySlug, type ProjectEntry } from '../content'
import { NotFoundPage } from './NotFoundPage'

export function ProjectDetailView({ entry }: { entry: ProjectEntry }) {
  return (
    <article className="editorial-page">
      <EntryHero
        cover={entry.cover}
        eyebrow={`PROJET / ${entry.year}`}
        metadata={[
          { label: 'Statut', value: entry.status },
          { label: 'Rôle', value: entry.role },
          { label: 'Technologies', value: entry.stack },
          { label: 'Tags', value: entry.tags },
        ]}
        summary={entry.introduction}
        title={entry.title}
      />
      <EntrySections links={entry.links} sections={entry.sections} />
    </article>
  )
}

export function ProjectDetailPage() {
  const { slug = '' } = useParams()
  const entry = getPublishedProjectBySlug(slug)
  return entry ? <ProjectDetailView entry={entry} /> : <NotFoundPage detail />
}

export default ProjectDetailPage
