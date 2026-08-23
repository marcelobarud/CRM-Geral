import { useEffect, useState, type FormEvent } from 'react'

import { FeedbackBanner } from '../../components/FeedbackBanner'
import { PageHeader } from '../../components/PageHeader'
import { getApiErrorMessage } from '../../services/httpClient'
import {
  createCustomField,
  listCustomFields,
  updateCustomField,
} from '../customFields/api'
import type {
  CustomFieldDefinition,
  CustomFieldDefinitionPayload,
  CustomFieldModule,
  CustomFieldType,
} from '../customFields/types'

const modules: { value: CustomFieldModule; label: string }[] = [
  { value: 'customers', label: 'Clientes' },
  { value: 'products', label: 'Produtos' },
  { value: 'employees', label: 'Funcionários' },
  { value: 'suppliers', label: 'Fornecedores' },
]

const emptyForm: CustomFieldDefinitionPayload = {
  nome: '',
  tipo: 'text',
  opcoes: [],
  obrigatorio: false,
  ativo: true,
  ordem: 0,
}

export function CustomFieldsPage() {
  const [module, setModule] = useState<CustomFieldModule>('customers')
  const [fields, setFields] = useState<CustomFieldDefinition[]>([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{
    kind: 'success' | 'error'
    message: string
  } | null>(null)

  // oxlint-disable-next-line react/set-state-in-effect
  useEffect(() => {
    let active = true
    // oxlint-disable-next-line react/set-state-in-effect
    setLoading(true)
    void listCustomFields(module)
      .then((items) => {
        if (active) setFields(items)
      })
      .catch(() => {
        if (active) setFields([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [module])

  const update = (
    key: keyof CustomFieldDefinitionPayload,
    value: string | boolean | number | string[],
  ) => setForm((current) => ({ ...current, [key]: value }))

  const cancelEdit = () => {
    setEditingId(null)
    setForm(emptyForm)
  }

  const beginEdit = (field: CustomFieldDefinition) => {
    setEditingId(field.id)
    setForm({
      nome: field.nome,
      tipo: field.tipo,
      opcoes: field.opcoes,
      obrigatorio: field.obrigatorio,
      ativo: field.ativo,
      ordem: field.ordem,
    })
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setFeedback(null)
    try {
      if (editingId === null) {
        const saved = await createCustomField(module, form)
        setFields((current) => [...current, saved])
        setFeedback({ kind: 'success', message: 'Campo personalizado criado.' })
      } else {
        const saved = await updateCustomField(module, editingId, form)
        setFields((current) => current.map((item) => item.id === saved.id ? saved : item))
        setFeedback({ kind: 'success', message: 'Campo personalizado atualizado.' })
      }
      cancelEdit()
    } catch (error) {
      setFeedback({
        kind: 'error',
        message: getApiErrorMessage(error, 'Não foi possível salvar o campo.'),
      })
    } finally {
      setSaving(false)
    }
  }

  const toggle = async (field: CustomFieldDefinition) => {
    try {
      const saved = await updateCustomField(module, field.id, { ativo: !field.ativo })
      setFields((current) => current.map((item) => item.id === saved.id ? saved : item))
    } catch (error) {
      setFeedback({ kind: 'error', message: getApiErrorMessage(error, 'Não foi possível atualizar o campo.') })
    }
  }

  return (
    <div className="settings-page">
      <PageHeader eyebrow="Configurações" title="Campos personalizados" description="Defina campos extras para Clientes, Produtos, Funcionários e Fornecedores." />
      {feedback ? <FeedbackBanner kind={feedback.kind} message={feedback.message} onDismiss={() => setFeedback(null)} /> : null}
      <div className="custom-fields-layout">
        <section className="settings-card">
          <label className="form-field"><span>Cadastro</span><select value={module} onChange={(event) => { setModule(event.target.value as CustomFieldModule); cancelEdit() }}>{modules.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label>
          <div className="custom-field-list">
            <p className="eyebrow">Campos de {modules.find((item) => item.value === module)?.label}</p>
            {loading ? <p className="form-help">Carregando campos...</p> : fields.length === 0 ? <p className="form-help">Nenhum campo personalizado criado.</p> : fields.map((field) => <div className="custom-field-row" key={field.id}><div><strong>{field.nome}</strong><span>{field.tipo}{field.obrigatorio ? ' · obrigatório' : ''} · ordem {field.ordem}</span></div><div className="table-actions"><button className="table-action" type="button" onClick={() => beginEdit(field)}>Editar</button><button className="button button-secondary" type="button" onClick={() => void toggle(field)}>{field.ativo ? 'Desativar' : 'Ativar'}</button></div></div>)}
          </div>
        </section>
        <form className="settings-card" onSubmit={(event) => void submit(event)}>
          <p className="eyebrow">{editingId === null ? 'Novo campo' : 'Editar campo'}</p><h2>Definição</h2>
          <div className="form-grid">
            <div className="form-field form-grid-wide"><label htmlFor="custom-field-name">Nome</label><input id="custom-field-name" required value={form.nome} onChange={(event) => update('nome', event.target.value)} /></div>
            <div className="form-field"><label htmlFor="custom-field-type">Tipo</label><select id="custom-field-type" value={form.tipo} onChange={(event) => update('tipo', event.target.value as CustomFieldType)}><option value="text">Texto</option><option value="integer">Inteiro</option><option value="decimal">Decimal</option><option value="date">Data</option><option value="boolean">Booleano</option><option value="select">Lista de opções</option></select></div>
            <div className="form-field"><label htmlFor="custom-field-order">Ordem</label><input id="custom-field-order" type="number" min="0" value={form.ordem} onChange={(event) => update('ordem', Number(event.target.value))} /></div>
            {form.tipo === 'select' ? <div className="form-field form-grid-wide"><label htmlFor="custom-field-options">Opções (uma por linha)</label><textarea id="custom-field-options" required value={form.opcoes.join('\n')} onChange={(event) => update('opcoes', event.target.value.split('\n'))} /></div> : null}
            <label className="checkbox-field"><input type="checkbox" checked={form.obrigatorio} onChange={(event) => update('obrigatorio', event.target.checked)} /> Campo obrigatório</label>
          </div>
          <div className="form-actions">{editingId !== null ? <button className="button button-secondary" type="button" onClick={cancelEdit}>Cancelar edição</button> : null}<button className="button button-primary" type="submit" disabled={saving}>{saving ? 'Salvando...' : editingId === null ? 'Criar campo' : 'Salvar campo'}</button></div>
        </form>
      </div>
    </div>
  )
}
