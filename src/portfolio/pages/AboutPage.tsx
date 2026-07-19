import styles from '../PortfolioShell.module.css'

export function AboutPage() {
  return (
    <section className={styles.page} aria-labelledby="about-title">
      <p className={styles.eyebrow}>À propos</p>
      <h1 className={styles.pageTitle} id="about-title" tabIndex={-1}>
        Créer comme on traverse le chaos.
      </h1>
      <p className={styles.lead}>
        SEROLYN explore les points de contact entre le code, l’image et la musique. Trois langages
        pour donner une forme provisoire à ce qui paraît confus.
      </p>
      <section className={styles.section} aria-labelledby="about-approach">
        <h2 id="about-approach">Une pratique en mouvement</h2>
        <p>
          Les outils ne sont pas une fin : ils servent à rendre les tensions lisibles, à déplacer
          le regard et à ouvrir de nouvelles trajectoires.
        </p>
      </section>
    </section>
  )
}
