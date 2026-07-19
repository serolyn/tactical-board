interface EmptyStateProps {
  label: string
  message: string
}

export function EmptyState({ label, message }: EmptyStateProps) {
  return (
    <div className="empty-state" role="status">
      <p className="portfolio-meta">{label}</p>
      <p>{message}</p>
      <span aria-hidden="true">00 / —</span>
    </div>
  )
}
