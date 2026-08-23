import { request, requestJson } from '../../services/httpClient'
import type { AppearanceConfig, AppearancePatch } from './types'

export function getAppearance(): Promise<AppearanceConfig> {
  return request<AppearanceConfig>('/api/settings/appearance')
}

export function updateAppearance(payload: AppearancePatch): Promise<AppearanceConfig> {
  return requestJson<AppearanceConfig>('/api/settings/appearance', 'PATCH', payload)
}

export function resetAppearance(): Promise<AppearanceConfig> {
  return requestJson<AppearanceConfig>('/api/settings/appearance/reset', 'POST', {})
}

export function uploadAppearanceLogo(file: File): Promise<AppearanceConfig> {
  return request<AppearanceConfig>('/api/settings/appearance/logo', {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  })
}
