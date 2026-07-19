import { Link } from 'react-router'
import { EmptyState } from '../components/EmptyState'
import { EntryIndex } from '../components/EntryIndex'
import { HeroVisualSlot } from '../components/HeroVisualSlot'
import { SectionHeading } from '../components/SectionHeading'
import {
  publishedLab,
  publishedMusic,
  publishedProjects,
  siteContent,
} from '../content'

export function HomePage() {
  return (
    <article className="home-page">
      <section className="home-hero" aria-labelledby="home-title">
        <HeroVisualSlot alt={siteContent.home.visual.alt} src={siteContent.home.visual.src} />

        <div className="home-hero__inner">
          <div className="home-hero__copy">
            <p className="portfolio-meta">{siteContent.home.overline}</p>
            <h1 aria-label={siteContent.home.title} id="home-title" tabIndex={-1}>
              ENTRE<br />PLUSIEURS<br />VIES
            </h1>
            <p className="home-hero__lead">{siteContent.home.introduction}</p>
            <div className="home-hero__actions">
              <Link className="portfolio-action portfolio-action--primary" to="/projects">
                Explorer les projets
              </Link>
              <Link className="text-action" to="/music">
                Écouter les scènes <span aria-hidden="true">↘</span>
              </Link>
            </div>
          </div>

          <p aria-hidden="true" className="portfolio-ghost home-hero__ghost">ce qui flotte.</p>
          <span aria-hidden="true" className="home-hero__signal" />
        </div>
      </section>

      <section className="editorial-section home-section" aria-labelledby="home-lab-title">
        <div className="page-boundary">
          <SectionHeading
            eyebrow="LAB / ACTIF"
            id="home-lab-title"
            index="01 / 04"
            introduction="Études, erreurs et expériences construites au fil de l’apprentissage."
            title="FORMES EN COURS"
          />
          <div className="home-section__content">
            <EntryIndex entries={publishedLab} routeBase="/lab" />
          </div>
        </div>
      </section>

      <section className="editorial-section home-section" aria-labelledby="home-projects-title">
        <div className="page-boundary">
          <SectionHeading
            eyebrow="PROJETS / INDEX"
            id="home-projects-title"
            index="02 / 04"
            introduction="Réalisations suffisamment construites ou documentées pour être parcourues."
            title="PROJETS"
          />
          <div className="home-section__content">
            {publishedProjects.length ? (
              <EntryIndex entries={publishedProjects} routeBase="/projects" />
            ) : (
              <EmptyState label="PROJETS / 00" message={siteContent.projects.emptyState} />
            )}
          </div>
        </div>
      </section>

      <section className="editorial-section home-section" aria-labelledby="home-music-title">
        <div className="page-boundary">
          <SectionHeading
            eyebrow="MUSIQUE / SCÈNES"
            id="home-music-title"
            index="03 / 04"
            introduction={siteContent.music.introduction}
            title={siteContent.music.title}
          />
          <div className="home-section__content">
            {publishedMusic.length ? (
              <EntryIndex entries={publishedMusic} routeBase="/music" />
            ) : (
              <div className="home-music-atmosphere">
                <figure>
                  <img
                    alt={siteContent.music.atmosphere.alt}
                    decoding="async"
                    loading="lazy"
                    src={siteContent.music.atmosphere.src}
                  />
                </figure>
                <div className="home-music-atmosphere__content">
                  <p className="portfolio-meta">SCÈNE / EN ATTENTE</p>
                  <p>{siteContent.music.introduction}</p>
                  <div>
                    <p className="music-empty-message">{siteContent.music.emptyState}</p>
                    <Link className="text-action" to="/music">
                      Ouvrir les scènes <span aria-hidden="true">↘</span>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="editorial-section" aria-labelledby="home-about-title">
        <div className="page-boundary home-about-fragment">
          <p className="portfolio-meta">04 / À PROPOS</p>
          <blockquote id="home-about-title">Je construis entre code, son et image.</blockquote>
          <div className="home-about-fragment__aside">
            <p>{siteContent.home.aboutFragment}</p>
            <Link className="text-action" to="/about">
              Lire la suite <span aria-hidden="true">↘</span>
            </Link>
          </div>
        </div>
      </section>
    </article>
  )
}
