/**
 * @packageDocumentation
 * Composant visuel réutilisable du portfolio.
 *
 * Ce fichier découpe l'interface en une petite pièce lisible: en-tête, carte,
 * section, indice ou bloc de liens. Si tu veux modifier ce que l'utilisateur
 * voit à l'écran, c'est souvent ici qu'il faut commencer.
 */

import { EntryCard, type EntryCardData } from './PortfolioEntryCard'
import { StaggerGroup, StaggerItem } from '../motion/StaggerGroup'

interface EntryIndexProps {
  entries: readonly EntryCardData[]
  routeBase: '/projects' | '/music' | '/lab'
}
/**
 * Cette fonction intervient sur le sujet “entry Index” dans portfolio.
 *
 * Fichier: src/portfolio/components/EntryIndex.tsx
 * Si tu lis ce fichier pour apprendre, regarde d’abord EntryIndex dans EntryIndex.tsx.
 */


export function EntryIndex({ entries, routeBase }: EntryIndexProps) {
  return (
    <StaggerGroup as="ol" className="entry-index">
      {entries.map((entry, index) => (
        <StaggerItem as="li" key={entry.slug}>
          <EntryCard entry={entry} index={index} routeBase={routeBase} />
        </StaggerItem>
      ))}
    </StaggerGroup>
  )
}
