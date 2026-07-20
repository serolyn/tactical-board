import { Link } from 'react-router'
import { EditorialHeader } from './components/EditorialHeader'
import { AnimatedRoutes } from './motion/AnimatedRoutes'
import { PortfolioMotionProvider } from './motion/PortfolioMotionProvider'
import './styles/tokens.css'
import './styles/typography.css'
import './styles/portfolio.css'

/** Cadre sémantique et navigable au clavier partagé par toutes les routes du portfolio. */
export function PortfolioShell() {
  return (
    <PortfolioMotionProvider>
      <div className="portfolio-shell" data-portfolio-scroll>
        <a className="portfolio-skip-link" href="#portfolio-main">
          Aller au contenu
        </a>

        <EditorialHeader />

        <main className="portfolio-main" id="portfolio-main" tabIndex={-1}>
          <AnimatedRoutes pageClassName="portfolio-page-frame" />
        </main>

        <footer className="portfolio-footer">
          <div className="portfolio-footer__inner">
            <div>
              <p className="portfolio-meta">À PROPOS</p>
              <Link to="/about">Je construis entre code, son et image.</Link>
            </div>
            <p>© 2026 SEROLYN</p>
            <a href="#portfolio-main">RETOUR / HAUT ↑</a>
          </div>
        </footer>
      </div>
    </PortfolioMotionProvider>
  )
}
