type LoadingStateProps = {
  label?: string
}

export function LoadingState({ label = 'Carregando...' }: LoadingStateProps) {
  return (
    <div className="state-card" role="status" aria-live="polite">
      <span className="state-icon state-icon-loading" aria-hidden="true">
        ⋯
      </span>
      <div>
        <strong>{label}</strong>
        <p>Estamos preparando as informações para você.</p>
      </div>
    </div>
  )
}
