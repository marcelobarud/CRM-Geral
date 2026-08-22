import { request, requestJson } from '../../services/httpClient'
import type { Supplier, SupplierDetails, SupplierPayload } from './types'

export type SupplierListFilters = {
  search?: string
  city?: string
  state?: string
}

export function listSuppliers(filters: SupplierListFilters = {}): Promise<Supplier[]> {
  const params = new URLSearchParams()
  const search = filters.search?.trim()
  const city = filters.city?.trim()
  const state = filters.state?.trim()
  if (search) params.set('search', search)
  if (city) params.set('city', city)
  if (state) params.set('state', state)
  const query = params.toString()
  return request<Supplier[]>(`/api/suppliers${query ? `?${query}` : ''}`)
}

export function getSupplier(id: number): Promise<SupplierDetails> {
  return request<SupplierDetails>(`/api/suppliers/${id}`)
}

export function createSupplier(payload: SupplierPayload): Promise<Supplier> {
  return requestJson<Supplier>('/api/suppliers', 'POST', payload)
}

export function updateSupplier(
  id: number,
  payload: Partial<SupplierPayload>,
): Promise<Supplier> {
  return requestJson<Supplier>(`/api/suppliers/${id}`, 'PATCH', payload)
}

export function deleteSupplier(id: number): Promise<void> {
  return request<unknown>(`/api/suppliers/${id}`, { method: 'DELETE' }).then(() => undefined)
}
