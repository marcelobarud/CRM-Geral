type FilterActionsProps = {
  canClear: boolean
  onApply: () => void
  onClear: () => void
}

export function FilterActions({ canClear, onApply, onClear }: FilterActionsProps) {
  return (
    <div className="filter-actions">
      <button className="button button-secondary" type="button" onClick={onClear} disabled={!canClear}>
        Limpar filtros
      </button>
      <button className="button button-primary" type="button" onClick={onApply}>
        Aplicar filtros
      </button>
    </div>
  )
}
