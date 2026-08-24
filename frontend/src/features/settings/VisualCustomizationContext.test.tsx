// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import * as appearanceApi from './api'
import {
  VisualCustomizationProvider,
  useCustomizable,
  useVisualCustomization,
} from './VisualCustomizationContext'

vi.mock('./api', () => ({
  getAppearanceOverrides: vi.fn(),
  updateAppearanceOverride: vi.fn(),
  resetAppearanceOverride: vi.fn(),
}))

function Fixture() {
  const { start, active } = useVisualCustomization()
  const button = useCustomizable({
    key: 'customers.create_button',
    type: 'BUTTON',
    group: 'primary-action',
    page: 'customers',
    label: 'Novo cliente',
  })

  return <>
    <button type="button" onClick={start}>Ativar</button>
    <span>{active ? 'ativo' : 'inativo'}</span>
    <button type="button" {...button}>Novo cliente</button>
  </>
}

beforeEach(() => {
  vi.mocked(appearanceApi.getAppearanceOverrides).mockResolvedValue({
    items: [{
      id: 1,
      customization_key: 'customers.create_button',
      customization_type: 'BUTTON',
      customization_group: 'primary-action',
      pagina: 'customers',
      properties: { cor_fundo: '#123456', cor_texto: '#FFFFFF', raio: 12 },
    }],
  })
  vi.mocked(appearanceApi.updateAppearanceOverride).mockResolvedValue({
    id: 1,
    customization_key: 'customers.create_button',
    customization_type: 'BUTTON',
    customization_group: 'primary-action',
    pagina: 'customers',
    properties: { cor_fundo: '#ABCDEF' },
  })
  vi.mocked(appearanceApi.resetAppearanceOverride).mockResolvedValue(undefined)
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('modo de personalização visual', () => {
  it('mantém o comportamento normal desligado e seleciona um botão quando ativado', async () => {
    render(<VisualCustomizationProvider><Fixture /></VisualCustomizationProvider>)
    const target = await screen.findByRole('button', { name: 'Novo cliente' })

    expect(target.getAttribute('data-visual-customization-selected')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Ativar' }))
    fireEvent.click(target)

    expect(await screen.findByRole('heading', { name: 'Novo cliente' })).toBeTruthy()
    expect(screen.getByText('Tipo: Botão')).toBeTruthy()
    expect(target.getAttribute('data-visual-customization-selected')).toBe('true')
  })

  it('aplica preview imediato, desfaz, cancela e salva somente o draft', async () => {
    render(<VisualCustomizationProvider><Fixture /></VisualCustomizationProvider>)
    const target = await screen.findByRole('button', { name: 'Novo cliente' })
    fireEvent.click(screen.getByRole('button', { name: 'Ativar' }))
    fireEvent.click(target)

    const color = await screen.findByLabelText('Fundo')
    fireEvent.change(color, { target: { value: '#ABCDEF' } })
    expect(window.getComputedStyle(target).backgroundColor).toBe('rgb(171, 205, 239)')

    fireEvent.click(screen.getByRole('button', { name: 'Desfazer' }))
    expect(window.getComputedStyle(target).backgroundColor).toBe('rgb(18, 52, 86)')
    fireEvent.change(color, { target: { value: '#ABCDEF' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(window.getComputedStyle(target).backgroundColor).toBe('rgb(18, 52, 86)')
    expect(screen.queryByRole('status', { name: 'Personalização visual ativa' })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Ativar' }))
    fireEvent.click(target)
    fireEvent.change(await screen.findByLabelText('Fundo'), { target: { value: '#ABCDEF' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(appearanceApi.updateAppearanceOverride).toHaveBeenCalledWith(
      'customers.create_button',
      expect.objectContaining({ properties: expect.objectContaining({ cor_fundo: '#ABCDEF' }) }),
    ))
    expect(screen.queryByRole('status', { name: 'Personalização visual ativa' })).toBeNull()
  })
})
