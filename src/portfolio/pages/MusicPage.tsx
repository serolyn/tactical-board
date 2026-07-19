import styles from '../PortfolioShell.module.css'

export function MusicPage() {
  return (
    <section className={styles.page} aria-labelledby="music-title">
      <p className={styles.eyebrow}>Musique</p>
      <h1 className={styles.pageTitle} id="music-title" tabIndex={-1}>
        Écouter ce qui résiste aux mots.
      </h1>
      <p className={styles.lead}>
        Rythmes, textures et silences forment une autre carte : moins précise, peut-être, mais
        capable de révéler ce qui demeure sous la surface.
      </p>
      <section className={styles.section} aria-labelledby="music-coming">
        <h2 id="music-coming">Fragments à venir</h2>
        <p>Cet espace accueillera des pièces, des recherches sonores et leurs traces de création.</p>
      </section>
    </section>
  )
}
