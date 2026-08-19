// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '../../services/httpClient'
import * as salesApi from './api'
import { SalesPage } from './SalesPages'

vi.mock('./api', () => ({ listSales: vi.fn(), getSale: vi.fn() }))

const sale = {
  id: 70,
  data_venda: '2026-08-19T13:00:00Z',
  cliente: { id: 10, nome: 'Cliente Histórico' },
  funcionario: { id: 20, nome_completo: 'Funcionário Histórico' },
  itens: [{
    id: 700,
    produto: { id: 30, nome: 'Produto Histórico' },
    quantidade: '1.500',
    preco_unitario: '12.34',
    subtotal: '18.51',
  }],
  total: '18.51',
}

describe('SalesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(salesApi.listSales).mockResolvedValue([sale])
    vi.mocked(salesApi.getSale).mockResolvedValue(sale)
  })

  it('renders the list and shows historical prices and totals in details', async () => {
    render(<SalesPage />)
    await screen.findByText('#70')
    expect(screen.getByText('Cliente Histórico')).toBeTruthy()
    expect(screen.getByText('R$ 18,51')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Ver detalhes' }))
    await waitFor(() => expect(salesApi.getSale).toHaveBeenCalledWith(70))
    expect(await screen.findByRole('dialog', { name: 'Detalhes da venda #70' })).toBeTruthy()
    expect(screen.getByText('Produto Histórico')).toBeTruthy()
    expect(screen.getByText('1,500 × R$ 12,34')).toBeTruthy()
    expect(screen.getAllByText('R$ 18,51').length).toBeGreaterThanOrEqual(2)
  })

  it('renders the empty state', async () => {
    vi.mocked(salesApi.listSales).mockResolvedValue([])
    render(<SalesPage />)

    expect(await screen.findByText('Nenhuma venda registrada ainda')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Criar nova venda' })).toBeTruthy()
  })

  it('renders an API error state', async () => {
    vi.mocked(salesApi.listSales).mockRejectedValue(new ApiError(500, 'Falha ao consultar vendas.'))
    render(<SalesPage />)

    expect(await screen.findByText('Falha ao consultar vendas.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeTruthy()
  })
})
