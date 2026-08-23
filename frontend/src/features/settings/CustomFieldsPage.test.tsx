// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import * as customFieldsApi from '../customFields/api'
import { CustomFieldsPage } from './CustomFieldsPage'

vi.mock('../customFields/api', () => ({
  createCustomField: vi.fn(),
  listCustomFields: vi.fn(),
  updateCustomField: vi.fn(),
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

beforeEach(() => {
  vi.mocked(customFieldsApi.listCustomFields).mockResolvedValue([])
  vi.mocked(customFieldsApi.createCustomField).mockResolvedValue({ id: 1, nome: 'Segmento', tipo: 'select', opcoes: ['VIP'], obrigatorio: false, ativo: true, ordem: 0 })
  vi.mocked(customFieldsApi.updateCustomField).mockResolvedValue({ id: 1, nome: 'Segmento', tipo: 'select', opcoes: ['VIP'], obrigatorio: false, ativo: false, ordem: 0 })
})

describe('administração de campos personalizados', () => {
  it('cria um campo select no módulo selecionado', async () => {
    render(<CustomFieldsPage />)
    fireEvent.change(await screen.findByLabelText('Nome'), { target: { value: 'Segmento' } })
    fireEvent.change(screen.getByLabelText('Tipo'), { target: { value: 'select' } })
    fireEvent.change(screen.getByLabelText('Opções (uma por linha)'), { target: { value: 'VIP\nNovo' } })
    fireEvent.click(screen.getByRole('button', { name: 'Criar campo' }))

    await waitFor(() => expect(customFieldsApi.createCustomField).toHaveBeenCalledWith('customers', expect.objectContaining({ nome: 'Segmento', tipo: 'select', opcoes: ['VIP', 'Novo'] })))
  })

  it('separa a consulta por módulo de cadastro', async () => {
    render(<CustomFieldsPage />)
    fireEvent.change(await screen.findByLabelText('Cadastro'), { target: { value: 'products' } })
    await waitFor(() => expect(customFieldsApi.listCustomFields).toHaveBeenCalledWith('products'))
  })
})
