/**
 * @packageDocumentation
 * Composant visuel réutilisable du portfolio.
 *
 * Ce fichier découpe l'interface en une petite pièce lisible: en-tête, carte,
 * section, indice ou bloc de liens. Si tu veux modifier ce que l'utilisateur
 * voit à l'écran, c'est souvent ici qu'il faut commencer.
 */

import { Link } from 'react-router'

export interface EntryCardData {
  slug: string
  title: string
  year: number
  status: string
  summary: string
  cover?: {
    src: string
    alt: string
  }
  tags?: readonly string[]
}

interface EntryCardProps {
  entry: EntryCardData
  index: number
  routeBase: '/projects' | '/music' | '/lab'
  priority?: boolean
}
/**
 * Cette fonction intervient sur le sujet “entry Card” dans portfolio.
 *
 * Fichier: src/portfolio/components/EntryCard.tsx
 * Si tu lis ce fichier pour apprendre, regarde d’abord EntryCard dans EntryCard.tsx.
 */


export function EntryCard({ entry, index, routeBase, priority = false }: EntryCardProps) {
  const entryNumber = String(index + 1).padStart(2, '0')

  return (
    <article className={`entry-card entry-card--${entry.slug}`}>
      <Link
        aria-label={`Découvrir ${entry.title}`}
        className="entry-card__link"
        to={`${routeBase}/${entry.slug}`}
      >
        <div className="entry-card__visual">
          {entry.cover ? (
            <img
              alt={entry.cover.alt}
              decoding="async"
              loading={priority ? 'eager' : 'lazy'}
              src={entry.cover.src}
            />
          ) : (
            <span aria-hidden="true" className="entry-card__void" />
          )}
          <span className="entry-card__number">{entryNumber}</span>
        </div>

        <div className="entry-card__body">
          <p className="portfolio-meta">
            {entry.year} / {entry.status}
          </p>
          <h3>{entry.title}</h3>
          <p>{entry.summary}</p>
          {entry.tags?.length ? (
            <ul aria-label="Technologies et thèmes" className="entry-card__tags">
              {entry.tags.map((tag) => <li key={tag}>{tag}</li>)}
            </ul>
          ) : null}
          <span className="entry-card__action">OUVRIR <i aria-hidden="true">↘</i></span>
        </div>
      </Link>
    </article>
  )
}
