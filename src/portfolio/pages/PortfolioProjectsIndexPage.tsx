import { EmptyState } from '../components/PortfolioEmptyState'
import { EntryIndex } from '../components/PortfolioEntryIndex'
import { SectionHeading } from '../components/PortfolioSectionHeading'
import { publishedProjects, siteContent } from '../content/portfolioContent'

export function ProjectsPage() {
  return (
    <article className="editorial-page">
      <header className="page-boundary page-intro">
        <div className="page-intro__copy">
          <p className="portfolio-meta">INDEX / PROJETS / 00</p>
          <h1 tabIndex={-1}>{siteContent.projects.title}</h1>
          <p className="page-intro__lead">
            Réalisations suffisamment construites ou documentées pour être parcourues.
          </p>
        </div>
        <div className="index-atmosphere" aria-hidden="true">
          <p>ARCHIVE / EN CONSTRUCTION</p>
        </div>
      </header>

      <section className="page-boundary page-index-content" aria-labelledby="projects-index-title">
        <SectionHeading
          eyebrow="ARCHIVE PUBLIQUE"
          id="projects-index-title"
          index="01 / INDEX"
          introduction="Chaque entrée conserve un contexte, un rôle, une pile technique et une documentation extensible."
          title="SYSTÈMES DOCUMENTÉS"
        />
        {publishedProjects.length ? (
          <EntryIndex entries={publishedProjects} routeBase="/projects" />
        ) : (
          <EmptyState label="PROJETS / 00" message={siteContent.projects.emptyState} />
        )}
      </section>
    </article>
  )
}
