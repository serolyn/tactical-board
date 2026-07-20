import { useCallback, useState } from 'react'
import { m, useReducedMotion } from 'motion/react'
import { EmptyState } from '../components/EmptyState'
import { EntryIndex } from '../components/EntryIndex'
import { HeroVisualSlot } from '../components/HeroVisualSlot'
import { SectionHeading } from '../components/SectionHeading'
import { AnimatedLink } from '../motion/AnimatedLink'
import { Reveal } from '../motion/Reveal'
import {
  getHeroArrivalVariants,
  getHeroSignalVariants,
} from '../motion/motionTokens'
import {
  publishedLab,
  publishedMusic,
  publishedProjects,
  siteContent,
} from '../content'

export function HomePage() {
  const [ghostSignalActive, setGhostSignalActive] = useState(false)
  const reducedMotion = Boolean(useReducedMotion())
  const handleGhostSignalChange = useCallback((active: boolean) => {
    setGhostSignalActive(active)
  }, [])

  return (
    <article className="home-page">
      <section className="home-hero" aria-labelledby="home-title">
        <HeroVisualSlot
          alt={siteContent.home.visual.alt}
          onSignalChange={handleGhostSignalChange}
          src={siteContent.home.visual.src}
        />

        <div className="home-hero__inner">
          <div className="home-hero__copy">
            <m.p
              animate="visible"
              className="portfolio-meta"
              initial="hidden"
              variants={getHeroArrivalVariants(reducedMotion, 0)}
            >
              {siteContent.home.overline}
            </m.p>
            <h1 aria-label={siteContent.home.title} id="home-title" tabIndex={-1}>
              {['ENTRE', 'PLUSIEURS', 'VIES'].map((line, index) => (
                <m.span
                  animate="visible"
                  aria-hidden="true"
                  initial="hidden"
                  key={line}
                  variants={getHeroArrivalVariants(reducedMotion, index + 1)}
                >
                  {line}
                </m.span>
              ))}
            </h1>
            <m.p
              animate="visible"
              className="home-hero__lead"
              initial="hidden"
              variants={getHeroArrivalVariants(reducedMotion, 4)}
            >
              {siteContent.home.introduction}
            </m.p>
            <m.div
              animate="visible"
              className="home-hero__actions"
              initial="hidden"
              variants={getHeroArrivalVariants(reducedMotion, 5)}
            >
              <AnimatedLink className="portfolio-action portfolio-action--primary" to="/projects">
                Explorer les projets
              </AnimatedLink>
              <AnimatedLink className="text-action" indicator="arrow" to="/music">
                Écouter les scènes
              </AnimatedLink>
            </m.div>
          </div>

          <p aria-hidden="true" className="portfolio-ghost home-hero__ghost">ce qui flotte.</p>
          <m.span
            animate="visible"
            aria-hidden="true"
            className={`home-hero__signal${ghostSignalActive ? ' home-hero__signal--active' : ''}`}
            initial="hidden"
            variants={getHeroSignalVariants(reducedMotion)}
          />
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
              <Reveal className="home-music-atmosphere">
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
                    <AnimatedLink className="text-action" indicator="arrow" to="/music">
                      Ouvrir les scènes
                    </AnimatedLink>
                  </div>
                </div>
              </Reveal>
            )}
          </div>
        </div>
      </section>

      <section className="editorial-section" aria-labelledby="home-about-title">
        <Reveal className="page-boundary home-about-fragment">
          <p className="portfolio-meta">04 / À PROPOS</p>
          <blockquote id="home-about-title">Je construis entre code, son et image.</blockquote>
          <div className="home-about-fragment__aside">
            <p>{siteContent.home.aboutFragment}</p>
            <AnimatedLink className="text-action" indicator="arrow" to="/about">
              Lire la suite
            </AnimatedLink>
          </div>
        </Reveal>
      </section>
    </article>
  )
}
