/**
 * @packageDocumentation
 * Composant visuel réutilisable du portfolio.
 *
 * Ce fichier découpe l'interface en une petite pièce lisible: en-tête, carte,
 * section, indice ou bloc de liens. Si tu veux modifier ce que l'utilisateur
 * voit à l'écran, c'est souvent ici qu'il faut commencer.
 */

import { Reveal } from '../motion/Reveal'

interface EmptyStateProps {
  label: string
  message: string
}
/**
 * Cette fonction intervient sur le sujet “empty State” dans portfolio.
 *
 * Fichier: src/portfolio/components/EmptyState.tsx
 * Si tu lis ce fichier pour apprendre, regarde d’abord EmptyState dans EmptyState.tsx.
 */


export function EmptyState({ label, message }: EmptyStateProps) {
  return (
    <Reveal className="empty-state" role="status">
      <p className="portfolio-meta">{label}</p>
      <p>{message}</p>
      <span aria-hidden="true">00 / —</span>
    </Reveal>
  )
}
