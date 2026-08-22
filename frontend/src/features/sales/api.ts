import { request, requestJson } from '../../services/httpClient'
import type { Sale, SaleCreatePayload } from './types'

export type SaleListFilters = {
  search?: string
  productId?: number | ''
  customerId?: number | ''
  employeeId?: number | ''
  dateFrom?: string
  dateTo?: string
  totalMin?: string
  totalMax?: string
}

export function listSales(filters: SaleListFilters = {}): Promise<Sale[]> {
  const params = new URLSearchParams()
  const search = filters.search?.trim()
  if (search) params.set('search', search)
  if (filters.productId) params.set('product_id', String(filters.productId))
  if (filters.customerId) params.set('customer_id', String(filters.customerId))
  if (filters.employeeId) params.set('employee_id', String(filters.employeeId))
  if (filters.dateFrom) params.set('date_from', filters.dateFrom)
  if (filters.dateTo) params.set('date_to', filters.dateTo)
  if (filters.totalMin?.trim()) params.set('total_min', filters.totalMin.trim())
  if (filters.totalMax?.trim()) params.set('total_max', filters.totalMax.trim())
  const query = params.toString()
  return request<Sale[]>(`/api/sales${query ? `?${query}` : ''}`)
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
