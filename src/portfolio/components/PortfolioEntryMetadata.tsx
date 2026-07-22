export interface MetadataItem {
  label: string
  value: string | readonly string[]
}

interface EntryMetadataProps {
  items: readonly MetadataItem[]
}

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
