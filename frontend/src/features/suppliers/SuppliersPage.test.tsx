// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import * as suppliersApi from './api'
import { SuppliersPage } from './SuppliersPage'

afterEach(() => {
  cleanup()
})

vi.mock('./api', () => ({
  createSupplier: vi.fn(),
  deleteSupplier: vi.fn(),
  getSupplier: vi.fn(),
  listSuppliers: vi.fn(),
  updateSupplier: vi.fn(),
}))

const supplier = {
  id: 1,
  nome: 'Fornecedor de teste',
  cidade: 'São Paulo',
  estado: 'SP',
  rua: 'Rua A',
  numero: '10',
  complemento: null,
  cnpj: '12.345.678/0001-90',
}

describe('SuppliersPage relational details', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(suppliersApi.listSuppliers).mockResolvedValue([supplier])
    vi.mocked(suppliersApi.getSupplier).mockResolvedValue({
      ...supplier,
      produtos: [{ id: 7, nome: 'Produto com nome suficientemente longo para quebrar linha' }],
    })
  })

  it('shows supplied products in the supplier detail', async () => {
    render(<SuppliersPage />)

    await screen.findByText('Fornecedor de teste')
    fireEvent.click(screen.getByRole('button', { name: 'Ver' }))

    expect(await screen.findByText('Produtos fornecidos')).toBeTruthy()
    expect(screen.getByText('Produto com nome suficientemente longo para quebrar linha')).toBeTruthy()
    expect(suppliersApi.getSupplier).toHaveBeenCalledWith(supplier.id)
  })

  it('shows an explicit empty state when the supplier has no products', async () => {
    vi.mocked(suppliersApi.getSupplier).mockResolvedValue({ ...supplier, produtos: [] })
    render(<SuppliersPage />)

    await screen.findByText('Fornecedor de teste')
    fireEvent.click(screen.getByRole('button', { name: 'Ver' }))

    expect(await screen.findByText('Nenhum produto associado a este fornecedor.')).toBeTruthy()
  })
})
