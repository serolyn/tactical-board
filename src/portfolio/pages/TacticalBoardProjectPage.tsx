import { Link } from 'react-router'
import styles from '../PortfolioShell.module.css'

export function TacticalBoardProjectPage() {
  return (
    <article className={styles.page} aria-labelledby="tactical-board-title">
      <p className={styles.eyebrow}>Projet — Tactical Board</p>
      <h1 className={styles.pageTitle} id="tactical-board-title" tabIndex={-1}>
        Cartographier une guerre intérieure.
      </h1>
      <p className={styles.lead}>
        Une cartographie interactive où projets, obstacles, ressources et objectifs deviennent
        forces, fronts et trajectoires.
      </p>

      <section className={styles.section} aria-labelledby="tactical-board-language">
        <h2 id="tactical-board-language">Un langage tactique personnel</h2>
        <p>
          Le plateau donne une position aux tensions, dessine les mouvements et rend visibles les
          rapports de force. La stratégie devient une manière de prendre du recul.
        </p>
        <ul className={styles.quietList}>
          <li>Composer des scénarios et organiser des factions.</li>
          <li>Déplacer les forces, marquer les objectifs et tracer les trajectoires.</li>
          <li>Conserver, importer et exporter chaque cartographie.</li>
        </ul>
      </section>

      <div className={styles.actions}>
        <Link className={styles.primaryLink} to="/board">
          Ouvrir Tactical Board
        </Link>
        <Link className={styles.secondaryLink} to="/projects">
          Retour aux projets
        </Link>
      </div>
    </article>
  )
}
