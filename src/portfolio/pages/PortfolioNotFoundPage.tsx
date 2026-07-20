/**
 * @packageDocumentation
 * Page routée du portfolio.
 *
 * Une page assemble plusieurs composants pour former un écran complet. Si tu
 * veux comprendre la structure d'une route comme l'accueil, le lab ou un détail,
 * lis ce fichier en premier.
 */

import { Link } from 'react-router'

interface NotFoundPageProps {
  detail?: boolean
}
/**
 * Cette fonction intervient sur le sujet “not Found Page” dans portfolio.
 *
 * Fichier: src/portfolio/pages/NotFoundPage.tsx
 * Si tu lis ce fichier pour apprendre, regarde d’abord NotFoundPage dans NotFoundPage.tsx.
 */


export function NotFoundPage({ detail = false }: NotFoundPageProps) {
  return (
    <section className="page-boundary not-found" aria-labelledby="not-found-title">
      <p className="portfolio-meta">ERREUR / 404</p>
      <h1 id="not-found-title" tabIndex={-1}>
        {detail ? 'ENTRÉE INTROUVABLE' : 'SIGNAL INTROUVABLE'}
      </h1>
      <p>
        {detail
          ? 'Cette entrée n’existe pas, reste en brouillon ou n’est plus publiée.'
          : 'La page demandée n’existe pas ou sa position a changé.'}
      </p>
      <div className="not-found__actions">
        <Link className="portfolio-action portfolio-action--primary" to="/">
          Revenir à l’accueil
        </Link>
        <Link className="portfolio-action portfolio-action--secondary" to="/lab">
          Explorer le Lab
        </Link>
      </div>
    </section>
  )
}
