import { request, requestJson } from '../../services/httpClient'
import type { Customer, CustomerPayload } from './types'

export function listCustomers(): Promise<Customer[]> {
  return request<Customer[]>('/api/customers')
}

export function getCustomer(id: number): Promise<Customer> {
  return request<Customer>(`/api/customers/${id}`)
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
