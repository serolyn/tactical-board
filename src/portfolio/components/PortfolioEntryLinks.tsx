import type { ContentLink } from '../content/portfolioContentTypes'
import { AnimatedLink } from '../motion/AnimatedLink'
import { Reveal } from '../motion/Reveal'

/**
 * Construit une URL statique compatible avec le base path du site.
 *
 * Cette fonction évite de répéter le préfixe GitHub Pages partout dans le code.
 */
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
/**
 * Choisit le bon rendu selon le type de lien de contenu.
 *
 * Les liens internes utilisent le routeur React, les liens statiques passent
 * par le base path du déploiement, et les liens externes restent de simples ancres.
 */
export function ContentLinkAction({ link, primary = false }: ContentLinkActionProps) {
  const className = primary
    ? 'portfolio-action portfolio-action--primary'
    : 'portfolio-action portfolio-action--secondary'

  if (link.kind === 'internal') {
    return <AnimatedLink className={className} to={link.href}>{link.label}</AnimatedLink>
  }

  const href = link.kind === 'static' ? staticHref(link.href) : link.href
  return <a className={className} href={href}>{link.label}</a>
}
/**
 * Affiche le groupe de liens d'une entrée éditoriale.
 *
 * Si aucune destination n'existe, la fonction retourne `null` pour ne pas
 * afficher de bloc vide dans la page.
 */
export function EntryLinks({ links }: { links: readonly ContentLink[] }) {
  if (!links.length) return null

  return (
    <Reveal as="section" className="entry-section entry-links" aria-labelledby="entry-links-title">
      <p className="entry-section__index">∞ / LIENS</p>
      <div className="entry-section__content">
        <h2 id="entry-links-title">Continuer</h2>
        <div className="entry-links__actions">
          {links.map((link) => <ContentLinkAction key={`${link.kind}-${link.href}`} link={link} />)}
        </div>
      </div>
    </Reveal>
  )
}
