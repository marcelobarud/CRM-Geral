import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

import { getApiErrorMessage } from '../../services/httpClient'
import { getAppearance, getPageAppearance, resetAppearance, resetPageAppearance, updateAppearance, updatePageAppearance, uploadAppearanceLogo } from './api'
import { appearanceCssVars } from './theme'
import { appearanceLabels, defaultAppearance, type AppearanceConfig, type AppearanceLabels, type AppearancePageId, type AppearancePatch, type PageAppearanceConfig, type PageAppearanceOverrides } from './types'

type AppearanceContextValue = {
  appearance: AppearanceConfig
  labels: AppearanceLabels
  loading: boolean
  error: string | null
  preview: AppearanceConfig
  setPreview: (value: AppearanceConfig) => void
  save: (patch: AppearancePatch) => Promise<AppearanceConfig>
  reset: () => Promise<AppearanceConfig>
  uploadLogo: (file: File) => Promise<AppearanceConfig>
  pageAppearances: Partial<Record<AppearancePageId, PageAppearanceConfig>>
  loadPageAppearance: (page: AppearancePageId) => Promise<PageAppearanceConfig>
  savePageAppearance: (page: AppearancePageId, payload: PageAppearanceOverrides) => Promise<PageAppearanceConfig>
  resetPageAppearance: (page: AppearancePageId) => Promise<PageAppearanceConfig>
}

const AppearanceContext = createContext<AppearanceContextValue | null>(null)

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [appearance, setAppearance] = useState(defaultAppearance)
  const [preview, setPreview] = useState(defaultAppearance)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pageAppearances, setPageAppearances] = useState<Partial<Record<AppearancePageId, PageAppearanceConfig>>>({})

  useEffect(() => {
    let active = true
    void getAppearance()
      .then((value) => {
        if (!active) return
        setAppearance(value)
        setPreview(value)
      })
      .catch((loadError: unknown) => {
        if (active) setError(getApiErrorMessage(loadError, 'A aparência padrão está sendo usada.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  useEffect(() => {
    const root = document.documentElement
    for (const [name, value] of Object.entries(appearanceCssVars(preview))) {
      root.style.setProperty(name, value)
    }
  }, [preview])

  const loadPageAppearance = useCallback(async (page: AppearancePageId) => {
    const value = await getPageAppearance(page)
    setPageAppearances((current) => ({ ...current, [page]: value }))
    return value
  }, [])

  const savePageAppearance = useCallback(async (page: AppearancePageId, payload: PageAppearanceOverrides) => {
    const value = await updatePageAppearance(page, payload)
    setPageAppearances((current) => ({ ...current, [page]: value }))
    return value
  }, [])

  const resetPageAppearanceValue = useCallback(async (page: AppearancePageId) => {
    const value = await resetPageAppearance(page)
    setPageAppearances((current) => ({ ...current, [page]: value }))
    return value
  }, [])

  const value = useMemo<AppearanceContextValue>(() => ({
    appearance,
    labels: appearanceLabels(preview),
    loading,
    error,
    preview,
    setPreview,
    save: async (patch) => {
      const saved = await updateAppearance(patch)
      setAppearance(saved)
      setPreview(saved)
      return saved
    },
    reset: async () => {
      const resetValue = await resetAppearance()
      setAppearance(resetValue)
      setPreview(resetValue)
      return resetValue
    },
    uploadLogo: async (file) => {
      const saved = await uploadAppearanceLogo(file)
      setAppearance(saved)
      setPreview(saved)
      return saved
    },
    pageAppearances,
    loadPageAppearance,
    savePageAppearance,
    resetPageAppearance: resetPageAppearanceValue,
  }), [appearance, error, loading, preview, pageAppearances, loadPageAppearance, savePageAppearance, resetPageAppearanceValue])

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>
}

// oxlint-disable-next-line react/only-export-components
export function useAppearance(): AppearanceContextValue {
  const context = useContext(AppearanceContext)
  if (!context) throw new Error('useAppearance deve ser usado dentro de AppearanceProvider.')
  return context
}
