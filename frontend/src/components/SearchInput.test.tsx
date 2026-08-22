// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useState } from 'react'

import { SearchInput } from './SearchInput'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

function SearchHarness({ onSearch }: { onSearch: (value: string) => void }) {
  const [value, setValue] = useState('')
  return <SearchInput value={value} onChange={setValue} onSearch={onSearch} />
}

describe('SearchInput', () => {
  it('debounces typing and only applies the latest value', () => {
    vi.useFakeTimers()
    const onSearch = vi.fn()
    render(<SearchHarness onSearch={onSearch} />)
    const input = screen.getByRole('searchbox')

    fireEvent.change(input, { target: { value: 'A' } })
    act(() => vi.advanceTimersByTime(200))
    fireEvent.change(input, { target: { value: 'AB' } })
    act(() => vi.advanceTimersByTime(299))
    expect(onSearch).not.toHaveBeenCalled()

    act(() => vi.advanceTimersByTime(1))
    expect(onSearch).toHaveBeenCalledTimes(1)
    expect(onSearch).toHaveBeenCalledWith('AB')
  })

  it('renders one clear control and applies an empty search after clearing', () => {
    vi.useFakeTimers()
    const onSearch = vi.fn()
    render(<SearchHarness onSearch={onSearch} />)
    const input = screen.getByRole('searchbox')

    fireEvent.change(input, { target: { value: 'Fornecedor' } })
    expect(screen.getAllByRole('button', { name: 'Limpar pesquisa' })).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: 'Limpar pesquisa' }))

    act(() => vi.advanceTimersByTime(300))
    expect((input as HTMLInputElement).value).toBe('')
    expect(onSearch).toHaveBeenCalledWith('')
  })
})
