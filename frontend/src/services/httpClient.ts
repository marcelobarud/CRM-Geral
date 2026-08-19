import type { ApiErrorPayload, HealthResponse } from '../types/api'

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()

export const API_BASE_URL = (
  configuredBaseUrl || 'http://127.0.0.1:8000'
).replace(/\/+$/, '')

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function readResponseBody(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return null

  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

export async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...init?.headers,
      },
    })
  } catch {
    throw new ApiError(0, 'Não foi possível conectar ao backend.')
  }

  const body = await readResponseBody(response)

  if (!response.ok) {
    const payload = body as ApiErrorPayload | null
    const message =
      payload?.detail || 'Não foi possível concluir a solicitação.'
    throw new ApiError(response.status, message)
  }

  return body as T
}

export function requestJson<T>(
  path: string,
  method: 'POST' | 'PATCH',
  payload: unknown,
): Promise<T> {
  return request<T>(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function getApiErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (error instanceof ApiError) return error.message
  return fallback
}

export function getHealth(): Promise<HealthResponse> {
  return request<HealthResponse>('/api/health')
}
