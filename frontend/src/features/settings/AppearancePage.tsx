import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'

import { FeedbackBanner } from '../../components/FeedbackBanner'
import { PageHeader } from '../../components/PageHeader'
import { getApiErrorMessage } from '../../services/httpClient'
import { useAppearance } from './AppearanceContext'
import type { AppearanceConfig } from './types'

const editableKeys: (keyof AppearanceConfig)[] = [
  'nome_sistema', 'cor_primaria', 'cor_secundaria', 'cor_destaque',
  'cor_fundo', 'cor_superficie', 'cor_texto', 'raio_controle', 'raio_card',
  'rotulo_dashboard', 'rotulo_clientes', 'rotulo_produtos', 'rotulo_funcionarios',
  'rotulo_fornecedores', 'rotulo_vendas', 'rotulo_nova_venda',
]

export function AppearancePage() {
  const { appearance, preview, setPreview, save, reset, uploadLogo, loading } = useAppearance()
  const [form, setForm] = useState(appearance)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(appearance.logo_url)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    setForm(appearance)
    setLogoPreview(appearance.logo_url)
  }, [appearance])

  const updateField = (key: keyof AppearanceConfig, value: string) => {
    const next = { ...form, [key]: value }
    setForm(next)
    setPreview(next)
  }

  const chooseLogo = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    setLogoFile(file)
    if (logoPreview?.startsWith('blob:')) URL.revokeObjectURL(logoPreview)
    setLogoPreview(file ? URL.createObjectURL(file) : appearance.logo_url)
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setFeedback(null)
    try {
      const payload = Object.fromEntries(editableKeys.map((key) => [key, form[key]]))
      await save(payload)
      if (logoFile) await uploadLogo(logoFile)
      setLogoFile(null)
      setFeedback({ kind: 'success', message: 'Aparência salva com sucesso.' })
    } catch (saveError) {
      setFeedback({ kind: 'error', message: getApiErrorMessage(saveError, 'Não foi possível salvar a aparência.') })
    } finally {
      setSaving(false)
    }
  }

  const restoreDefaults = async () => {
    setSaving(true)
    setFeedback(null)
    try {
      await reset()
      setLogoFile(null)
      setFeedback({ kind: 'success', message: 'Aparência restaurada para os valores padrão.' })
    } catch (resetError) {
      setFeedback({ kind: 'error', message: getApiErrorMessage(resetError, 'Não foi possível restaurar a aparência.') })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="settings-page">
      <PageHeader eyebrow="Configurações" title="Aparência" description="Personalize a identidade visual do CRM com uma prévia imediata." />
      {feedback ? <FeedbackBanner kind={feedback.kind} message={feedback.message} onDismiss={() => setFeedback(null)} /> : null}
      <div className="settings-layout">
        <form className="settings-card" onSubmit={(event) => void submit(event)}>
          <div className="settings-card-heading"><div><p className="eyebrow">Identidade</p><h2>Marca e nomenclaturas</h2></div></div>
          <div className="form-grid">
            <div className="form-field form-grid-wide"><label htmlFor="appearance-name">Nome do sistema</label><input id="appearance-name" value={form.nome_sistema} onChange={(event) => updateField('nome_sistema', event.target.value)} required /></div>
            <div className="form-field form-grid-wide"><label htmlFor="appearance-logo">Logo (PNG, JPEG ou WEBP até 2 MB)</label><input id="appearance-logo" type="file" accept="image/png,image/jpeg,image/webp" onChange={chooseLogo} /></div>
            {(['rotulo_dashboard', 'rotulo_clientes', 'rotulo_produtos', 'rotulo_funcionarios', 'rotulo_fornecedores', 'rotulo_vendas', 'rotulo_nova_venda'] as const).map((key) => <div className="form-field" key={key}><label htmlFor={`appearance-${key}`}>{key.replace('rotulo_', 'Rótulo ').replaceAll('_', ' ')}</label><input id={`appearance-${key}`} value={form[key]} onChange={(event) => updateField(key, event.target.value)} required /></div>)}
          </div>
          <div className="settings-card-heading settings-heading-spaced"><div><p className="eyebrow">Paleta</p><h2>Cores e contornos</h2></div></div>
          <div className="appearance-options">{(['cor_primaria', 'cor_secundaria', 'cor_destaque', 'cor_fundo', 'cor_superficie', 'cor_texto'] as const).map((key) => <label className="appearance-color-field" key={key}>{key.replace('cor_', 'Cor ').replaceAll('_', ' ')}<input type="color" value={form[key]} onChange={(event) => updateField(key, event.target.value.toUpperCase())} /><code>{form[key]}</code></label>)}<label className="form-field">Raio dos controles<select value={form.raio_controle} onChange={(event) => updateField('raio_controle', event.target.value)}><option value="0.5rem">Compacto</option><option value="0.75rem">Padrão</option><option value="1rem">Arredondado</option></select></label><label className="form-field">Raio dos cards<select value={form.raio_card} onChange={(event) => updateField('raio_card', event.target.value)}><option value="1rem">Compacto</option><option value="1.5rem">Padrão</option><option value="2rem">Suave</option></select></label></div>
          <div className="form-actions"><button className="button button-secondary" type="button" onClick={() => void restoreDefaults()} disabled={saving}>Restaurar padrão</button><button className="button button-primary" type="submit" disabled={saving || loading}>{saving ? 'Salvando...' : 'Salvar aparência'}</button></div>
        </form>
        <aside className="appearance-preview-card" aria-label="Prévia da aparência"><p className="eyebrow">Prévia em tempo real</p><div className="appearance-preview-brand">{logoPreview ? <img src={logoPreview} alt="Prévia da logo" /> : <span className="brand-mark" aria-hidden="true">C</span>}<strong>{preview.nome_sistema}</strong></div><div className="appearance-preview-surface"><strong>{preview.rotulo_dashboard}</strong><p>Assim sua identidade aparece nas áreas principais.</p><button className="button button-primary" type="button">Ação principal</button></div><span className="form-help">Alterações de cores e nomes aparecem imediatamente; salvar torna-as permanentes.</span></aside>
      </div>
    </div>
  )
}
