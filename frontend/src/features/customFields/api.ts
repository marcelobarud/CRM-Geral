import { request, requestJson } from '../../services/httpClient'
import type { CustomFieldDefinition, CustomFieldDefinitionPayload, CustomFieldModule } from './types'

export function listCustomFields(module: CustomFieldModule): Promise<CustomFieldDefinition[]> {
  return request<CustomFieldDefinition[]>(`/api/settings/custom-fields/${module}`)
}

export function createCustomField(module: CustomFieldModule, payload: CustomFieldDefinitionPayload): Promise<CustomFieldDefinition> {
  return requestJson<CustomFieldDefinition>(`/api/settings/custom-fields/${module}`, 'POST', payload)
}

export function updateCustomField(module: CustomFieldModule, id: number, payload: Partial<CustomFieldDefinitionPayload>): Promise<CustomFieldDefinition> {
  return requestJson<CustomFieldDefinition>(`/api/settings/custom-fields/${module}/${id}`, 'PATCH', payload)
}
