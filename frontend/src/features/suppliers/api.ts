import { request, requestJson } from '../../services/httpClient'
import type { Supplier, SupplierPayload } from './types'

export function listSuppliers(): Promise<Supplier[]> {
  return request<Supplier[]>('/api/suppliers')
}

export function getSupplier(id: number): Promise<Supplier> {
  return request<Supplier>(`/api/suppliers/${id}`)
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
