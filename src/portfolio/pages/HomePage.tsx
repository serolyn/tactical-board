import { Link } from 'react-router'
import styles from '../PortfolioShell.module.css'

export function HomePage() {
  return (
    <section className={styles.hero} aria-labelledby="home-title">
      <p className={styles.eyebrow}>SEROLYN</p>
      <h1 className={styles.title} id="home-title" tabIndex={-1}>
        Code, image et musique pour cartographier le chaos.
      </h1>
      <p className={styles.lead}>
        Des formes numériques pour traverser l’incertitude, révéler les forces en présence et
        tracer des trajectoires possibles.
      </p>
      <div className={styles.actions}>
        <Link className={styles.primaryLink} to="/projects">
          Explorer les projets
        </Link>
        <Link className={styles.secondaryLink} to="/lab">
          Entrer dans le laboratoire
        </Link>
      </div>
    </section>
  )
}
