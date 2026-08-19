type FeedbackBannerProps = {
  kind: 'success' | 'error'
  message: string
  onDismiss?: () => void
}

export function FeedbackBanner({
  kind,
  message,
  onDismiss,
}: FeedbackBannerProps) {
  return (
    <div className={`feedback feedback-${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      <span aria-hidden="true">{kind === 'success' ? '✓' : '!'}</span>
      <p>{message}</p>
      {onDismiss ? (
        <button type="button" aria-label="Fechar mensagem" onClick={onDismiss}>
          ×
        </button>
      ) : null}
    </div>
  )
}
