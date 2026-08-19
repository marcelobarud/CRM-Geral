import { Modal } from './Modal'

type ConfirmDialogProps = {
  title: string
  description: string
  busy?: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmDialog({
  title,
  description,
  busy = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Modal title={title} description={description} onClose={onCancel}>
      <div className="confirm-actions">
        <button className="button button-secondary" type="button" onClick={onCancel} disabled={busy}>
          Cancelar
        </button>
        <button className="button button-danger" type="button" onClick={onConfirm} disabled={busy}>
          {busy ? 'Excluindo...' : 'Excluir'}
        </button>
      </div>
    </Modal>
  )
}
