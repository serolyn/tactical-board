import { Link } from 'react-router'
import styles from '../PortfolioShell.module.css'

export function ProjectsPage() {
  return (
    <section className={styles.page} aria-labelledby="projects-title">
      <p className={styles.eyebrow}>Projets</p>
      <h1 className={styles.pageTitle} id="projects-title" tabIndex={-1}>
        Des outils pour lire le terrain autrement.
      </h1>
      <p className={styles.lead}>
        Chaque projet transforme une tension abstraite en espace sensible, manipulable et
        partageable.
      </p>

      <ul className={styles.projectList}>
        <li className={styles.projectCard}>
          <p className={styles.eyebrow}>Application interactive</p>
          <h2>Tactical Board</h2>
          <p>
            Projets, obstacles, ressources et objectifs deviennent forces, fronts et
            trajectoires sur un plateau vivant.
          </p>
          <Link className={styles.textLink} to="/projects/tactical-board">
            Découvrir le projet
          </Link>
        </li>
      </ul>
    </section>
  )
}
