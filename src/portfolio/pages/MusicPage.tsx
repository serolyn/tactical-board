import { EmptyState } from '../components/EmptyState'
import { EntryIndex } from '../components/EntryIndex'
import { SectionHeading } from '../components/SectionHeading'
import { publishedMusic, siteContent } from '../content'
import MusicScene from '../webgl/musicScene'

export function MusicPage() {
  return (
    <article className="editorial-page">
      <header className="page-boundary page-intro">
        <div className="page-intro__copy">
          <p className="portfolio-meta">MUSIQUE / INDEX / 00</p>
          <section aria-hidden="true" className="music-page__visual">
            <MusicScene />
          </section>
          <h1 tabIndex={-1}>{siteContent.music.title}</h1>
          <p className="page-intro__lead">{siteContent.music.introduction}</p>
        </div>
        <figure className="page-intro__visual">
          <img
            alt={siteContent.music.atmosphere.alt}
            decoding="async"
            src={siteContent.music.atmosphere.src}
          />
          <span>REFLET / BRUME / CC0</span>
        </figure>
      </header>

      <section className="page-boundary page-index-content" aria-labelledby="music-index-title">
        <SectionHeading
          eyebrow="SCÈNES PUBLIÉES"
          id="music-index-title"
          index="01 / INDEX"
          introduction="Covers, crédits, notes et audio restent facultatifs jusqu’à la publication d’une scène réelle."
          title="LIEUX À HABITER"
        />
        {publishedMusic.length ? (
          <EntryIndex entries={publishedMusic} routeBase="/music" />
        ) : (
          <EmptyState label="SCÈNES / 00" message={siteContent.music.emptyState} />
        )}
      </section>
    </article>
  )
}
