import styles from '../PortfolioShell.module.css'

export function LabPage() {
  return (
    <section className={styles.page} aria-labelledby="lab-title">
      <p className={styles.eyebrow}>Laboratoire</p>
      <h1 className={styles.pageTitle} id="lab-title" tabIndex={-1}>
        Essais, erreurs et passages ouverts.
      </h1>
      <p className={styles.lead}>
        Le laboratoire rassemble les apprentissages en cours : idées incomplètes, prototypes et
        techniques éprouvées au contact du réel.
      </p>
      <section className={styles.section} aria-labelledby="lab-method">
        <h2 id="lab-method">Apprendre en construisant</h2>
        <p>
          Chaque expérience cherche moins la certitude qu’une nouvelle façon de voir, d’entendre
          ou d’agir.
        </p>
      </section>
    </section>
  )
}
