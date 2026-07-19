import { EntryCard, type EntryCardData } from './EntryCard'

interface EntryIndexProps {
  entries: readonly EntryCardData[]
  routeBase: '/projects' | '/music' | '/lab'
}

export function EntryIndex({ entries, routeBase }: EntryIndexProps) {
  return (
    <ol className="entry-index">
      {entries.map((entry, index) => (
        <li key={entry.slug}>
          <EntryCard entry={entry} index={index} routeBase={routeBase} />
        </li>
      ))}
    </ol>
  )
}
