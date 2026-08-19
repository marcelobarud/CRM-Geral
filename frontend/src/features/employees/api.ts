import { request, requestJson } from '../../services/httpClient'
import type { Employee, EmployeePayload } from './types'

export function listEmployees(): Promise<Employee[]> {
  return request<Employee[]>('/api/employees')
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
