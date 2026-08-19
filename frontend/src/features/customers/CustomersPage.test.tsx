// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as customersApi from './api'
import { CustomersPage } from './CustomersPage'

vi.mock('./api', () => ({
  createCustomer: vi.fn(),
  deleteCustomer: vi.fn(),
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

describe('CustomersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(customersApi.listCustomers).mockResolvedValue([])
    vi.mocked(customersApi.createCustomer).mockResolvedValue(customer)
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
})
