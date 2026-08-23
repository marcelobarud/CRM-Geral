// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AppearanceProvider } from './AppearanceContext'
import * as appearanceApi from './api'
import { AppearancePage } from './AppearancePage'
import { defaultAppearance } from './types'

vi.mock('./api', () => ({
  getAppearance: vi.fn(),
  resetAppearance: vi.fn(),
  updateAppearance: vi.fn(),
  uploadAppearanceLogo: vi.fn(),
}))

function renderPage() {
  return render(
    <AppearanceProvider>
      <AppearancePage />
    </AppearanceProvider>,
  )
}

beforeEach(() => {
  vi.mocked(appearanceApi.getAppearance).mockResolvedValue(defaultAppearance)
  vi.mocked(appearanceApi.updateAppearance).mockResolvedValue(defaultAppearance)
  vi.mocked(appearanceApi.resetAppearance).mockResolvedValue(defaultAppearance)
  vi.mocked(appearanceApi.uploadAppearanceLogo).mockResolvedValue(defaultAppearance)
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('configuração de aparência', () => {
  it('mantém a prévia visível e atualiza o nome antes de salvar', async () => {
    renderPage()
    const nameInput = await screen.findByLabelText('Nome do sistema')

    fireEvent.change(nameInput, { target: { value: 'CRM Loja' } })
    expect(screen.getByText('CRM Loja')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Salvar aparência' }))
    await waitFor(() => expect(appearanceApi.updateAppearance).toHaveBeenCalledWith(
      expect.objectContaining({ nome_sistema: 'CRM Loja' }),
    ))
  })

  it('oferece restauração explícita dos valores padrão', async () => {
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Restaurar padrão' }))
    await waitFor(() => expect(appearanceApi.resetAppearance).toHaveBeenCalledOnce())
  })
})
