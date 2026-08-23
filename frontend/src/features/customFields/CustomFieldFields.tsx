import { useEffect, useState } from 'react'

import { getApiErrorMessage } from '../../services/httpClient'
import { listCustomFields } from './api'
import type { CustomFieldDefinition, CustomFieldModule, CustomFieldValue } from './types'

type CustomFieldFieldsProps = {
  module: CustomFieldModule
  values: Record<string, unknown>
  onChange: (name: string, value: unknown) => void
}

// oxlint-disable-next-line react/only-export-components
export function useCustomFieldDefinitions(module: CustomFieldModule) {
  const [definitions, setDefinitions] = useState<CustomFieldDefinition[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void listCustomFields(module).then((items) => {
      if (active) setDefinitions(items.filter((item) => item.ativo).sort((a, b) => a.ordem - b.ordem || a.id - b.id))
    }).catch((loadError: unknown) => {
      if (active) setError(getApiErrorMessage(loadError, 'Não foi possível carregar os campos personalizados.'))
    })
    return () => { active = false }
  }, [module])

  return { definitions, error }
}

export function CustomFieldFields({ module, values, onChange }: CustomFieldFieldsProps) {
  const { definitions } = useCustomFieldDefinitions(module)
  if (definitions.length === 0) return null

  return <div className="custom-fields-grid"><div className="form-grid-wide"><p className="eyebrow">Campos personalizados</p></div>{definitions.map((field) => <label className="form-field" key={field.id}>{field.nome}{field.obrigatorio ? ' *' : ''}{field.tipo === 'select' ? <select required={field.obrigatorio} value={String(values[field.nome] ?? '')} onChange={(event) => onChange(field.nome, event.target.value)}><option value="">Selecione</option>{field.opcoes.map((option) => <option value={option} key={option}>{option}</option>)}</select> : field.tipo === 'boolean' ? <input type="checkbox" checked={Boolean(values[field.nome])} onChange={(event) => onChange(field.nome, event.target.checked)} /> : <input required={field.obrigatorio} type={field.tipo === 'date' ? 'date' : field.tipo === 'integer' || field.tipo === 'decimal' ? 'number' : 'text'} step={field.tipo === 'decimal' ? 'any' : undefined} value={String(values[field.nome] ?? '')} onChange={(event) => onChange(field.nome, event.target.value)} />}</label>)}</div>
}

export function CustomFieldDetails({ values }: { values?: CustomFieldValue[] }) {
  if (!values?.length) return null
  return <section className="custom-field-details" aria-label="Campos personalizados"><p className="eyebrow">Campos personalizados</p><dl className="detail-grid">{values.map((item) => <div key={item.campo_id}><dt>{item.nome}</dt><dd>{item.tipo === 'boolean' ? (item.valor ? 'Sim' : 'Não') : String(item.valor ?? 'Não informado')}</dd></div>)}</dl></section>
}
