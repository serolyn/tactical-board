import { Link } from 'react-router'

interface NotFoundPageProps {
  detail?: boolean
}

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
