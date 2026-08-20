// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import * as customersApi from './api'
import { CustomersPage } from './CustomersPage'

afterEach(() => {
  cleanup()
})

vi.mock('./api', () => ({
  createCustomer: vi.fn(),
  deleteCustomer: vi.fn(),
  getCustomer: vi.fn(),
  listCustomers: vi.fn(),
  updateCustomer: vi.fn(),
}))

const customer = {
  id: 1,
  nome: 'Ana Silva',
  cidade: 'São Paulo',
  estado: 'SP',
  rua: 'Rua A',
  numero: '10',
  complemento: null,
}

const customerDetails = {
  ...customer,
  produtos_comprados: [
    { produto_id: 7, nome: 'Produto com quantidade fracionária', quantidade: '3.625' },
    { produto_id: 8, nome: 'Produto repetido em vendas', quantidade: '1.000' },
  ],
}

describe('CustomersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(customersApi.listCustomers).mockResolvedValue([])
    vi.mocked(customersApi.createCustomer).mockResolvedValue(customer)
    vi.mocked(customersApi.getCustomer).mockResolvedValue(customerDetails)
  })

  it('opens an accessible form and sends empty optional complement as null', async () => {
    render(<CustomersPage />)

    await screen.findByRole('button', { name: '+ Novo cliente' })
    fireEvent.click(screen.getByRole('button', { name: '+ Novo cliente' }))

    expect(screen.getByRole('dialog', { name: 'Novo cliente' })).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Ana Silva' } })
    fireEvent.change(screen.getByLabelText('Cidade'), { target: { value: 'São Paulo' } })
    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'SP' } })
    fireEvent.change(screen.getByLabelText('Rua'), { target: { value: 'Rua A' } })
    fireEvent.change(screen.getByLabelText('Número'), { target: { value: '10' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar cliente' }))

    await waitFor(() => {
      expect(customersApi.createCustomer).toHaveBeenCalledWith({
        nome: 'Ana Silva',
        cidade: 'São Paulo',
        estado: 'SP',
        rua: 'Rua A',
        numero: '10',
        complemento: null,
      })
    })
    expect(screen.getByText('Cliente criado com sucesso.')).toBeTruthy()
  })

  it('shows purchased products and consolidated fractional quantity in the detail', async () => {
    vi.mocked(customersApi.listCustomers).mockResolvedValue([customer])
    render(<CustomersPage />)

    await screen.findByText('Ana Silva')
    fireEvent.click(screen.getByRole('button', { name: 'Ver' }))

    expect(await screen.findByText('Produtos comprados')).toBeTruthy()
    expect(screen.getByText('Produto com quantidade fracionária')).toBeTruthy()
    expect(screen.getByText('Quantidade: 3,625')).toBeTruthy()
    expect(customersApi.getCustomer).toHaveBeenCalledWith(customer.id)
  })

  it('shows an explicit empty state when the customer has no purchases', async () => {
    vi.mocked(customersApi.listCustomers).mockResolvedValue([customer])
    vi.mocked(customersApi.getCustomer).mockResolvedValue({ ...customer, produtos_comprados: [] })
    render(<CustomersPage />)

    await screen.findByText('Ana Silva')
    fireEvent.click(screen.getByRole('button', { name: 'Ver' }))

    expect(await screen.findByText('Nenhum produto comprado.')).toBeTruthy()
  })
})
