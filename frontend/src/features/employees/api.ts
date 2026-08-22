import { request, requestJson } from '../../services/httpClient'
import type { Employee, EmployeePayload } from './types'

export type EmployeeListOptions = {
  active?: boolean
  city?: string
  state?: string
}

export function listEmployees(
  activeOnly = false,
  search = '',
  options: EmployeeListOptions = {},
): Promise<Employee[]> {
  const params = new URLSearchParams()
  const active = options.active ?? (activeOnly ? true : undefined)
  if (active !== undefined) params.set('active', String(active))
  const normalizedSearch = search.trim()
  if (normalizedSearch) params.set('search', normalizedSearch)
  const city = options.city?.trim()
  const state = options.state?.trim()
  if (city) params.set('city', city)
  if (state) params.set('state', state)
  const query = params.toString()
  return request<Employee[]>(`/api/employees${query ? `?${query}` : ''}`)
}

export function getEmployee(id: number): Promise<Employee> {
  return request<Employee>(`/api/employees/${id}`)
}

export function createEmployee(payload: EmployeePayload): Promise<Employee> {
  return requestJson<Employee>('/api/employees', 'POST', payload)
}

export function updateEmployee(
  id: number,
  payload: Partial<EmployeePayload>,
): Promise<Employee> {
  return requestJson<Employee>(`/api/employees/${id}`, 'PATCH', payload)
}

export function deleteEmployee(id: number): Promise<void> {
  return request<unknown>(`/api/employees/${id}`, { method: 'DELETE' }).then(() => undefined)
}
