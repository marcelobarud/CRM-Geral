import { useId } from 'react'

type SearchInputProps = {
  value: string
  onChange: (value: string) => void
  onClear?: () => void
  label?: string
  placeholder?: string
  disabled?: boolean
}

export function SearchInput({
  value,
  onChange,
  onClear,
  label = 'Pesquisar',
  placeholder = 'Pesquisar...',
  disabled = false,
}: SearchInputProps) {
  const inputId = useId()

  return (
    <div className="search-input">
      <label htmlFor={inputId}>{label}</label>
      <div className="search-input-control">
        <input
          id={inputId}
          type="search"
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
        />
        {value ? (
          <button
            className="search-input-clear"
            type="button"
            aria-label="Limpar pesquisa"
            onClick={() => onClear?.() ?? onChange('')}
            disabled={disabled}
          >
            ×
          </button>
        ) : null}
      </div>
    </div>
  )
}
