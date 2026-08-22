import { request, requestJson } from '../../services/httpClient'
import type { Customer, CustomerDetails, CustomerPayload } from './types'

export type CustomerListFilters = {
  search?: string
  city?: string
  state?: string
}

export function listCustomers(filters: CustomerListFilters = {}): Promise<Customer[]> {
  const params = new URLSearchParams()
  const search = filters.search?.trim()
  const city = filters.city?.trim()
  const state = filters.state?.trim()
  if (search) params.set('search', search)
  if (city) params.set('city', city)
  if (state) params.set('state', state)
  const query = params.toString()
  return request<Customer[]>(`/api/customers${query ? `?${query}` : ''}`)
}

export function getCustomer(id: number): Promise<CustomerDetails> {
  return request<CustomerDetails>(`/api/customers/${id}`)
}

export function createCustomer(payload: CustomerPayload): Promise<Customer> {
  return requestJson<Customer>('/api/customers', 'POST', payload)
}

export function updateCustomer(
  id: number,
  payload: Partial<CustomerPayload>,
): Promise<Customer> {
  return requestJson<Customer>(`/api/customers/${id}`, 'PATCH', payload)
}

export function deleteCustomer(id: number): Promise<void> {
  return request<unknown>(`/api/customers/${id}`, { method: 'DELETE' }).then(() => undefined)
}
