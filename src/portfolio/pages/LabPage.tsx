import { EntryIndex } from '../components/EntryIndex'
import { SectionHeading } from '../components/SectionHeading'
import { publishedLab } from '../content'

export function LabPage() {
  return (
    <article className="editorial-page">
      <header className="page-boundary page-intro">
        <div className="page-intro__copy">
          <p className="portfolio-meta">LAB / INDEX / {String(publishedLab.length).padStart(2, '0')}</p>
          <h1 tabIndex={-1}>FORMES EN COURS</h1>
          <p className="page-intro__lead">
            Études, erreurs et expériences construites au fil de l’apprentissage.
          </p>
        </div>
        <div className="index-atmosphere index-atmosphere--lab" aria-hidden="true">
          <p>EXPÉRIENCES / SYSTÈMES / PROTOTYPES</p>
        </div>
      </header>

      <section className="page-boundary page-index-content" aria-labelledby="lab-index-title">
        <SectionHeading
          eyebrow="ENTRÉES ACTIVES"
          id="lab-index-title"
          index="01 / INDEX"
          introduction="Des outils vivants et des systèmes personnels, conservés avec leur contexte."
          title="LAB ACTIF"
        />
        <EntryIndex entries={publishedLab} routeBase="/lab" />
      </section>
    </article>
  )
}
