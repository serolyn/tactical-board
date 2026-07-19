import { Link, NavLink } from 'react-router'

const navigation = [
  { to: '/projects', label: 'Projets' },
  { to: '/music', label: 'Musique' },
  { to: '/lab', label: 'Lab' },
  { to: '/about', label: 'À propos' },
] as const

export function EditorialHeader() {
  return (
    <header className="portfolio-header">
      <div className="portfolio-header__inner">
        <Link className="portfolio-wordmark" to="/" aria-label="SEROLYN — accueil">
          SEROLYN
        </Link>

        <nav aria-label="Navigation principale">
          <ul className="portfolio-navigation">
            {navigation.map((item) => (
              <li key={item.to}>
                <NavLink
                  className={({ isActive }) =>
                    isActive
                      ? 'portfolio-navigation__link portfolio-navigation__link--active'
                      : 'portfolio-navigation__link'
                  }
                  to={item.to}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <p className="portfolio-header__index">PARIS / 2026</p>
      </div>
    </header>
  )
}
