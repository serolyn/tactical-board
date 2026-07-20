import { EntryCard, type EntryCardData } from './EntryCard'
import { StaggerGroup, StaggerItem } from '../motion/StaggerGroup'

interface EntryIndexProps {
  entries: readonly EntryCardData[]
  routeBase: '/projects' | '/music' | '/lab'
}

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
