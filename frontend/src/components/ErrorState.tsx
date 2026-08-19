type ErrorStateProps = {
  title?: string
  description: string
  onRetry?: () => void
}

export function ErrorState({
  title = 'Não foi possível carregar',
  description,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="state-card state-card-error" role="alert">
      <span className="state-icon" aria-hidden="true">
        !
      </span>
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
        {onRetry ? (
          <button className="text-button" type="button" onClick={onRetry}>
            Tentar novamente
          </button>
        ) : null}
      </div>
    </div>
  )
}
