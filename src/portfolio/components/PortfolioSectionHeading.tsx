/**
 * @packageDocumentation
 * Composant visuel réutilisable du portfolio.
 *
 * Ce fichier découpe l'interface en une petite pièce lisible: en-tête, carte,
 * section, indice ou bloc de liens. Si tu veux modifier ce que l'utilisateur
 * voit à l'écran, c'est souvent ici qu'il faut commencer.
 */

import { Reveal } from '../motion/Reveal'

interface SectionHeadingProps {
  index: string
  eyebrow: string
  title: string
  introduction?: string
  id?: string
}
/**
 * Cette fonction intervient sur le sujet “section Heading” dans portfolio.
 *
 * Fichier: src/portfolio/components/SectionHeading.tsx
 * Si tu lis ce fichier pour apprendre, regarde d’abord SectionHeading dans SectionHeading.tsx.
 */


export function SectionHeading({
  index,
  eyebrow,
  title,
  introduction,
  id,
}: SectionHeadingProps) {
  return (
    <Reveal as="header" className="section-heading">
      <p className="section-heading__index">{index}</p>
      <div className="section-heading__title-group">
        <p className="portfolio-meta">{eyebrow}</p>
        <h2 id={id}>{title}</h2>
      </div>
      {introduction ? <p className="section-heading__introduction">{introduction}</p> : null}
    </Reveal>
  )
}
