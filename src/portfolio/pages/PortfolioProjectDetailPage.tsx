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
import { getPublishedProjectBySlug, type ProjectEntry } from '../content/portfolioContent'
import { NotFoundPage } from './PortfolioNotFoundPage'
/**
 * Cette fonction intervient sur le sujet “project Detail View” dans portfolio.
 *
 * Fichier: src/portfolio/pages/ProjectDetailPage.tsx
 * Si tu lis ce fichier pour apprendre, regarde d’abord ProjectDetailView dans ProjectDetailPage.tsx.
 */


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
/**
 * Cette fonction intervient sur le sujet “project Detail Page” dans portfolio.
 *
 * Fichier: src/portfolio/pages/ProjectDetailPage.tsx
 * Si tu lis ce fichier pour apprendre, regarde d’abord ProjectDetailPage dans ProjectDetailPage.tsx.
 */


export function ProjectDetailPage() {
  const { slug = '' } = useParams()
  const entry = getPublishedProjectBySlug(slug)
  return entry ? <ProjectDetailView entry={entry} /> : <NotFoundPage detail />
}

export default ProjectDetailPage
