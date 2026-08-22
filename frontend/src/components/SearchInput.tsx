import { useEffect, useId, useRef } from 'react'

type SearchInputProps = {
  value: string
  onChange: (value: string) => void
  onClear?: () => void
  onSearch?: (value: string) => void
  debounceMs?: number
  label?: string
  placeholder?: string
  disabled?: boolean
}

export function SearchInput({
  value,
  onChange,
  onClear,
  onSearch,
  debounceMs = 300,
  label = 'Pesquisar',
  placeholder = 'Pesquisar...',
  disabled = false,
}: SearchInputProps) {
  const inputId = useId()
  const onSearchRef = useRef(onSearch)

  useEffect(() => {
    onSearchRef.current = onSearch
  }, [onSearch])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => onSearchRef.current?.(value), debounceMs)
    return () => window.clearTimeout(timeoutId)
  }, [debounceMs, value])

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
