import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

import { getApiErrorMessage } from '../../services/httpClient'
import { getAppearance, resetAppearance, updateAppearance, uploadAppearanceLogo } from './api'
import { appearanceLabels, defaultAppearance, type AppearanceConfig, type AppearanceLabels, type AppearancePatch } from './types'

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
}

const AppearanceContext = createContext<AppearanceContextValue | null>(null)

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [appearance, setAppearance] = useState(defaultAppearance)
  const [preview, setPreview] = useState(defaultAppearance)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
    root.style.setProperty('--appearance-primary', preview.cor_primaria)
    root.style.setProperty('--appearance-secondary', preview.cor_secundaria)
    root.style.setProperty('--appearance-accent', preview.cor_destaque)
    root.style.setProperty('--appearance-background', preview.cor_fundo)
    root.style.setProperty('--appearance-surface', preview.cor_superficie)
    root.style.setProperty('--appearance-text', preview.cor_texto)
    root.style.setProperty('--appearance-control-radius', preview.raio_controle)
    root.style.setProperty('--appearance-card-radius', preview.raio_card)
  }, [preview])

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
  }), [appearance, error, loading, preview])

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>
}

// oxlint-disable-next-line react/only-export-components
export function useAppearance(): AppearanceContextValue {
  const context = useContext(AppearanceContext)
  if (!context) throw new Error('useAppearance deve ser usado dentro de AppearanceProvider.')
  return context
}
