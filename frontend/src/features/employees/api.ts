import { request, requestJson } from '../../services/httpClient'
import type { Employee, EmployeePayload } from './types'

export function listEmployees(activeOnly = false, search = ''): Promise<Employee[]> {
  const params = new URLSearchParams()
  if (activeOnly) params.set('active', 'true')
  const normalizedSearch = search.trim()
  if (normalizedSearch) params.set('search', normalizedSearch)
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
