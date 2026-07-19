import { Link, NavLink, Outlet } from 'react-router'
import styles from './PortfolioShell.module.css'

const navigation = [
  { to: '/', label: 'Accueil', end: true },
  { to: '/projects', label: 'Projets', end: false },
  { to: '/music', label: 'Musique', end: true },
  { to: '/lab', label: 'Laboratoire', end: true },
  { to: '/about', label: 'À propos', end: true },
]

/** Semantic, keyboard-accessible frame shared by every portfolio route. */
export function PortfolioShell() {
  return (
    <div className={styles.shell} data-portfolio-scroll>
      <a className={styles.skipLink} href="#portfolio-main">
        Aller au contenu
      </a>

      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link className={styles.wordmark} to="/" aria-label="SEROLYN — accueil">
            SEROLYN
          </Link>

          <nav aria-label="Navigation principale">
            <ul className={styles.navigation}>
              {navigation.map((item) => (
                <li key={item.to}>
                  <NavLink
                    className={({ isActive }) =>
                      isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
                    }
                    end={item.end}
                    to={item.to}
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <main className={styles.main} id="portfolio-main" tabIndex={-1}>
        <Outlet />
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <p>SEROLYN — code, image et musique.</p>
          <Link to="/about">À propos de la démarche</Link>
        </div>
      </footer>
    </div>
  )
}
