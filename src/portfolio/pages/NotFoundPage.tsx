import { Link } from 'react-router'
import styles from '../PortfolioShell.module.css'

export function NotFoundPage() {
  return (
    <section className={styles.page} aria-labelledby="not-found-title">
      <p className={styles.eyebrow}>Erreur 404</p>
      <h1 className={styles.pageTitle} id="not-found-title" tabIndex={-1}>
        Cette trajectoire ne mène nulle part.
      </h1>
      <p className={styles.lead}>
        La page demandée n’existe pas, ou sa position a changé dans la cartographie.
      </p>
      <div className={styles.actions}>
        <Link className={styles.primaryLink} to="/">
          Revenir à l’accueil
        </Link>
        <Link className={styles.secondaryLink} to="/projects">
          Voir les projets
        </Link>
      </div>
    </section>
  )
}
