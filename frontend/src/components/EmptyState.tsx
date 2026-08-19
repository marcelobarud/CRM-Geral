type EmptyStateProps = {
  title: string
  description: string
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <span className="empty-state-mark" aria-hidden="true">
        ✦
      </span>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  )
}
