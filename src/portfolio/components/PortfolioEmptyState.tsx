import { Reveal } from '../motion/Reveal'

interface EmptyStateProps {
  label: string
  message: string
}

export function EmptyState({ label, message }: EmptyStateProps) {
  return (
    <Reveal className="empty-state" role="status">
      <p className="portfolio-meta">{label}</p>
      <p>{message}</p>
      <span aria-hidden="true">00 / —</span>
    </Reveal>
  )
}
