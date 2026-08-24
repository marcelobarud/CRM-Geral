import { request, requestJson } from '../../services/httpClient'
import type {
  AppearanceConfig,
  AppearancePageId,
  AppearancePatch,
  PageAppearanceConfig,
  PageAppearanceOverrides,
  AppearanceOverride,
  AppearanceOverridePayload,
} from './types'

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

export function getPageAppearance(page: AppearancePageId): Promise<PageAppearanceConfig> {
  return request<PageAppearanceConfig>(`/api/settings/appearance/pages/${page}`)
}

export function updatePageAppearance(
  page: AppearancePageId,
  payload: PageAppearanceOverrides,
): Promise<PageAppearanceConfig> {
  return requestJson<PageAppearanceConfig>(`/api/settings/appearance/pages/${page}`, 'PATCH', payload)
}

export function resetPageAppearance(page: AppearancePageId): Promise<PageAppearanceConfig> {
  return requestJson<PageAppearanceConfig>(`/api/settings/appearance/pages/${page}/reset`, 'POST', {})
}

export function getAppearanceOverrides(): Promise<{ items: AppearanceOverride[] }> {
  return request<{ items: AppearanceOverride[] }>('/api/settings/appearance/overrides')
}

export function updateAppearanceOverride(
  customizationKey: string,
  payload: AppearanceOverridePayload,
): Promise<AppearanceOverride> {
  return requestJson<AppearanceOverride>(
    `/api/settings/appearance/overrides/${customizationKey}`,
    'PUT',
    payload,
  )
}

export function resetAppearanceOverride(customizationKey: string): Promise<void> {
  return requestJson<void>(
    `/api/settings/appearance/overrides/${customizationKey}`,
    'DELETE',
    {},
  )
}
