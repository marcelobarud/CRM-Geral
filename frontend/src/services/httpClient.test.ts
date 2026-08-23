// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApiError, getApiErrorMessage, request } from './httpClient'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('cliente HTTP', () => {
  it('preserva a mensagem de um erro HTTP sem convertê-lo em falha de conexão', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ detail: 'Dados inválidos para criação.' }), {
        status: 422,
        headers: { 'Content-Type': 'application/json' },
      }),
    ))

    const error = await request('/api/settings/custom-fields/customers').catch(
      (value: unknown) => value,
    )

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(422)
    expect(getApiErrorMessage(error, 'Não foi possível conectar ao backend.'))
      .toBe('Dados inválidos para criação.')
  })

  it('usa a mensagem de conexão somente quando não existe resposta HTTP', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')))

    const error = await request('/api/settings/appearance/reset').catch(
      (value: unknown) => value,
    )

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(0)
    expect(getApiErrorMessage(error, 'fallback')).toBe(
      'Não foi possível conectar ao backend.',
    )
  })
})
