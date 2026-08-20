import { request, requestJson } from '../../services/httpClient'
import type { Sale, SaleCreatePayload } from './types'

export function listSales(): Promise<Sale[]> {
  return request<Sale[]>('/api/sales')
}

export function getSale(id: number): Promise<Sale> {
  return request<Sale>(`/api/sales/${id}`)
}

export function deleteSale(id: number): Promise<void> {
  return request<unknown>(`/api/sales/${id}`, { method: 'DELETE' }).then(() => undefined)
}

export function createSale(payload: SaleCreatePayload): Promise<Sale> {
  return requestJson<Sale>('/api/sales', 'POST', payload)
}
