import { siteContent } from '../content'

export function AboutPage() {
  const optionalLinks = [...siteContent.socialLinks, ...siteContent.contactLinks]

  return (
    <article className="editorial-page">
      <header className="page-boundary page-intro">
        <div className="page-intro__copy">
          <p className="portfolio-meta">SEROLYN / À PROPOS / 2026</p>
          <h1 tabIndex={-1}>{siteContent.about.title}</h1>
          <p className="page-intro__lead">{siteContent.about.introduction}</p>
        </div>
        <div className="index-atmosphere" aria-hidden="true">
          <p>CODE / SON / IMAGE</p>
        </div>
      </header>

      <section className="editorial-section">
        <div className="page-boundary about-grid">
          <section className="about-block" aria-labelledby="about-approach-title">
            <p className="portfolio-meta">01 / APPROCHE</p>
            <h2 id="about-approach-title">Approche</h2>
            <p>{siteContent.about.approach}</p>
          </section>
          <section className="about-block" aria-labelledby="about-now-title">
            <p className="portfolio-meta">02 / EN CE MOMENT</p>
            <h2 id="about-now-title">En ce moment</h2>
            <p>{siteContent.about.current}</p>
          </section>
          <section className="about-block" aria-labelledby="about-tech-title">
            <p className="portfolio-meta">03 / TECHNOLOGIES</p>
            <h2 id="about-tech-title">Technologies</h2>
            <ul className="technology-list">
              {siteContent.about.technologies.map((technology) => (
                <li key={technology}>{technology}</li>
              ))}
            </ul>
          </section>
          {optionalLinks.length ? (
            <section className="about-block" aria-labelledby="about-links-title">
              <p className="portfolio-meta">04 / LIENS</p>
              <h2 id="about-links-title">Contact</h2>
              <ul className="optional-links">
                {optionalLinks.map((link) => (
                  <li key={link.href}><a href={link.href}>{link.label}</a></li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </section>
    </article>
  )
}
