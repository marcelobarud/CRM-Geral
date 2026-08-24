import { useEffect, type ReactNode } from 'react'
import { useCustomizable } from '../features/settings/VisualCustomizationContext'

type ModalProps = {
  title: string
  description?: string
  children: ReactNode
  onClose: () => void
  size?: 'small' | 'large'
}

export function Modal({
  title,
  description,
  children,
  onClose,
  size = 'small',
}: ModalProps) {
  const surfaceCustomization = useCustomizable({ key: 'global.modal.surface', type: 'SURFACE', group: 'modal', label: title })
  const titleCustomization = useCustomizable({ key: 'global.modal.title', type: 'TEXT', group: 'modal-title', label: title })
  const closeCustomization = useCustomizable({ key: 'global.modal.close', type: 'BUTTON', group: 'modal-action', label: 'Fechar' })
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className={`modal-card modal-card-${size}`}
        {...surfaceCustomization}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 id="modal-title" {...titleCustomization}>{title}</h2>
            {description ? <p>{description}</p> : null}
          </div>
          <button
            className="icon-button"
            {...closeCustomization}
            type="button"
            aria-label="Fechar"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        {children}
      </section>
    </div>
  )
}
