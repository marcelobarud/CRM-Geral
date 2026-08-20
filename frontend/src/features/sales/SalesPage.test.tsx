// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '../../services/httpClient'
import * as salesApi from './api'
import { SalesPage } from './SalesPages'

vi.mock('./api', () => ({ listSales: vi.fn(), getSale: vi.fn(), deleteSale: vi.fn() }))

const sale = {
  id: 70,
  data_venda: '2026-08-19T13:00:00Z',
  cliente: { id: 10, nome: 'Cliente Histórico' },
  funcionario: { id: 20, nome_completo: 'Funcionário Histórico' },
  itens: [{
    id: 700,
    produto: { id: 30, nome: 'Produto Histórico' },
    fornecedor_id: 40,
    fornecedor: { id: 40, nome: 'Fornecedor Histórico' },
    quantidade: '1.500',
    preco_unitario: '12.34',
    subtotal: '18.51',
  }],
  total: '18.51',
}

describe('SalesPage', () => {
  afterEach(() => cleanup())

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(salesApi.listSales).mockResolvedValue([sale])
    vi.mocked(salesApi.getSale).mockResolvedValue(sale)
    vi.mocked(salesApi.deleteSale).mockResolvedValue(undefined)
  })

  it('renders the list and shows historical prices and totals in details', async () => {
    render(<SalesPage />)
    await screen.findByText('#70')
    expect(screen.getByText('Produto Histórico')).toBeTruthy()
    expect(screen.getByText('Cliente Histórico')).toBeTruthy()
    expect(screen.getByText('R$ 18,51')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Ver detalhes' }))
    await waitFor(() => expect(salesApi.getSale).toHaveBeenCalledWith(70))
    expect(await screen.findByRole('dialog', { name: 'Detalhes da venda #70' })).toBeTruthy()
    expect(screen.getAllByText('Produto Histórico').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('1,500')).toBeTruthy()
    expect(screen.getByText('Fornecedor Histórico')).toBeTruthy()
    expect(screen.getByText('R$ 12,34')).toBeTruthy()
    expect(screen.getAllByText('R$ 18,51').length).toBeGreaterThanOrEqual(2)
  })

  it.each([
    [2, '2 produtos'],
    [3, '3 produtos'],
  ])('summarizes a sale with %i products in the list', async (itemCount, label) => {
    const multipleItemSale = {
      ...sale,
      itens: Array.from({ length: itemCount }, (_, index) => ({
        ...sale.itens[0],
        id: sale.itens[0].id + index,
        produto: { id: 30 + index, nome: `Produto ${index + 1}` },
      })),
    }
    vi.mocked(salesApi.listSales).mockResolvedValue([multipleItemSale])

    render(<SalesPage />)

    expect(await screen.findByText(label)).toBeTruthy()
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

  it('opens and cancels the explicit sale deletion confirmation', async () => {
    render(<SalesPage />)
    await screen.findByText('#70')

    fireEvent.click(screen.getByRole('button', { name: 'Excluir venda' }))

    const dialog = await screen.findByRole('dialog', { name: 'Excluir venda #70?' })
    expect(within(dialog).getByText(/todos os itens associados/)).toBeTruthy()
    expect(within(dialog).getByText(/Clientes, funcionários e produtos não serão excluídos/)).toBeTruthy()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('dialog', { name: 'Excluir venda #70?' })).toBeNull()
    expect(screen.getByText('#70')).toBeTruthy()
    expect(salesApi.deleteSale).not.toHaveBeenCalled()
  })

  it('deletes the sale after confirmation and removes it from the list', async () => {
    render(<SalesPage />)
    await screen.findByText('#70')
    fireEvent.click(screen.getByRole('button', { name: 'Excluir venda' }))
    const dialog = await screen.findByRole('dialog', { name: 'Excluir venda #70?' })

    fireEvent.click(within(dialog).getByRole('button', { name: 'Excluir venda' }))

    await waitFor(() => expect(salesApi.deleteSale).toHaveBeenCalledWith(70))
    expect(screen.queryByText('#70')).toBeNull()
    expect(await screen.findByText('Venda #70 excluída com sucesso.')).toBeTruthy()
  })

  it('keeps the sale visible when the delete request fails', async () => {
    vi.mocked(salesApi.deleteSale).mockRejectedValue(new ApiError(500, 'Falha ao excluir venda.'))
    render(<SalesPage />)
    await screen.findByText('#70')
    fireEvent.click(screen.getByRole('button', { name: 'Excluir venda' }))
    const dialog = await screen.findByRole('dialog', { name: 'Excluir venda #70?' })

    fireEvent.click(within(dialog).getByRole('button', { name: 'Excluir venda' }))

    expect(await screen.findByText('Falha ao excluir venda.')).toBeTruthy()
    expect(screen.getByText('#70')).toBeTruthy()
    expect(screen.queryByText('Venda #70 excluída com sucesso.')).toBeNull()
  })
})
