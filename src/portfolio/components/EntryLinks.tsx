import { Link } from 'react-router'
import type { ContentLink } from '../content'

function staticHref(href: string) {
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`
  return `${base}${href.replace(/^\/+/, '')}`
}

interface ContentLinkActionProps {
  link: ContentLink
  primary?: boolean
}

export function ContentLinkAction({ link, primary = false }: ContentLinkActionProps) {
  const className = primary
    ? 'portfolio-action portfolio-action--primary'
    : 'portfolio-action portfolio-action--secondary'

  if (link.kind === 'internal') {
    return <Link className={className} to={link.href}>{link.label}</Link>
  }

  const href = link.kind === 'static' ? staticHref(link.href) : link.href
  return <a className={className} href={href}>{link.label}</a>
}

export function EntryLinks({ links }: { links: readonly ContentLink[] }) {
  if (!links.length) return null

  return (
    <section className="entry-section entry-links" aria-labelledby="entry-links-title">
      <p className="entry-section__index">∞ / LIENS</p>
      <div className="entry-section__content">
        <h2 id="entry-links-title">Continuer</h2>
        <div className="entry-links__actions">
          {links.map((link) => <ContentLinkAction key={`${link.kind}-${link.href}`} link={link} />)}
        </div>
      </div>
    </section>
  )
}
