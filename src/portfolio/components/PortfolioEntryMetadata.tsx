/**
 * @packageDocumentation
 * Composant visuel réutilisable du portfolio.
 *
 * Ce fichier découpe l'interface en une petite pièce lisible: en-tête, carte,
 * section, indice ou bloc de liens. Si tu veux modifier ce que l'utilisateur
 * voit à l'écran, c'est souvent ici qu'il faut commencer.
 */

export interface MetadataItem {
  label: string
  value: string | readonly string[]
}

interface EntryMetadataProps {
  items: readonly MetadataItem[]
}
/**
 * Cette fonction intervient sur le sujet “entry Metadata” dans portfolio.
 *
 * Fichier: src/portfolio/components/EntryMetadata.tsx
 * Si tu lis ce fichier pour apprendre, regarde d’abord EntryMetadata dans EntryMetadata.tsx.
 */


export function EntryMetadata({ items }: EntryMetadataProps) {
  return (
    <dl className="entry-metadata">
      {items.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>{Array.isArray(item.value) ? item.value.join(' · ') : item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
