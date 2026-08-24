type EmptyStateProps = {
  title: string
  description: string
}

export function EmptyState({ title, description }: EmptyStateProps) {
  const rootCustomization = useCustomizable({ key: 'global.empty-state', type: 'SURFACE', group: 'system-state', label: 'Estado vazio' })
  const titleCustomization = useCustomizable({ key: 'global.empty-state.title', type: 'TEXT', group: 'system-state', label: title })
  const descriptionCustomization = useCustomizable({ key: 'global.empty-state.description', type: 'TEXT', group: 'system-state', label: description })
  return (
    <div className="empty-state" {...rootCustomization}>
      <span className="empty-state-mark" aria-hidden="true">
        ✦
      </span>
      <strong {...titleCustomization}>{title}</strong>
      <p {...descriptionCustomization}>{description}</p>
    </div>
  )
}
import { useCustomizable } from '../features/settings/VisualCustomizationContext'
