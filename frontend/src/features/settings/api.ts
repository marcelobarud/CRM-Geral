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
  const inferredType = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
  }[file.name.slice(file.name.lastIndexOf('.')).toLowerCase()]
  const uploadFile = file.type || !inferredType
    ? file
    : new File([file], file.name, { type: inferredType })
  const formData = new FormData()
  formData.append('file', uploadFile)
  return request<AppearanceConfig>('/api/settings/appearance/logo', {
    method: 'PUT',
    body: formData,
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
