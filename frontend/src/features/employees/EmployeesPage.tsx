import { useCallback, useEffect, useState, type FormEvent } from 'react'

import { ConfirmDialog } from '../../components/ConfirmDialog'
import { EmptyState } from '../../components/EmptyState'
import { ErrorState } from '../../components/ErrorState'
import { FeedbackBanner } from '../../components/FeedbackBanner'
import { LoadingState } from '../../components/LoadingState'
import { Modal } from '../../components/Modal'
import { PageHeader } from '../../components/PageHeader'
import { getApiErrorMessage } from '../../services/httpClient'
import { createEmployee, deleteEmployee, listEmployees, updateEmployee } from './api'
import type { Employee, EmployeePayload } from './types'

const emptyEmployee: EmployeePayload = { nome_completo: '', cidade: '', estado: '', rua: '', numero: '', complemento: '', cpf: '', rg: '', data_nascimento: '' }

function EmployeeForm({ initialValue, saving, onCancel, onSave }: { initialValue: EmployeePayload; saving: boolean; onCancel: () => void; onSave: (payload: EmployeePayload) => void }) {
  const [form, setForm] = useState({ ...initialValue, complemento: initialValue.complemento ?? '', rg: initialValue.rg ?? '' })
  const updateField = (field: keyof EmployeePayload, value: string) => setForm((current) => ({ ...current, [field]: value }))
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); onSave({ ...form, complemento: form.complemento.trim() || null, rg: form.rg.trim() || null }) }

  return <form onSubmit={submit}><div className="form-grid">
    <div className="form-field form-grid-wide"><label htmlFor="employee-name">Nome completo</label><input id="employee-name" required value={form.nome_completo} onChange={(event) => updateField('nome_completo', event.target.value)} /></div>
    <div className="form-field"><label htmlFor="employee-cpf">CPF</label><input id="employee-cpf" required value={form.cpf} onChange={(event) => updateField('cpf', event.target.value)} /></div>
    <div className="form-field"><label htmlFor="employee-rg">RG (opcional)</label><input id="employee-rg" value={form.rg ?? ''} onChange={(event) => updateField('rg', event.target.value)} /></div>
    <div className="form-field"><label htmlFor="employee-birth">Data de nascimento</label><input id="employee-birth" required type="date" value={form.data_nascimento} onChange={(event) => updateField('data_nascimento', event.target.value)} /></div>
    <div className="form-field"><label htmlFor="employee-city">Cidade</label><input id="employee-city" required value={form.cidade} onChange={(event) => updateField('cidade', event.target.value)} /></div>
    <div className="form-field"><label htmlFor="employee-state">Estado</label><input id="employee-state" required maxLength={2} value={form.estado} onChange={(event) => updateField('estado', event.target.value.toUpperCase())} /></div>
    <div className="form-field"><label htmlFor="employee-street">Rua</label><input id="employee-street" required value={form.rua} onChange={(event) => updateField('rua', event.target.value)} /></div>
    <div className="form-field"><label htmlFor="employee-number">Número</label><input id="employee-number" required value={form.numero} onChange={(event) => updateField('numero', event.target.value)} /></div>
    <div className="form-field form-grid-wide"><label htmlFor="employee-complement">Complemento (opcional)</label><input id="employee-complement" value={form.complemento ?? ''} onChange={(event) => updateField('complemento', event.target.value)} /></div>
  </div><div className="form-actions"><button className="button button-secondary" type="button" onClick={onCancel} disabled={saving}>Cancelar</button><button className="button button-primary" type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar funcionário'}</button></div></form>
}

function EmployeeDetails({ employee }: { employee: Employee }) {
  return <dl className="detail-grid"><div><dt>Nome completo</dt><dd>{employee.nome_completo}</dd></div><div><dt>CPF</dt><dd>{employee.cpf}</dd></div><div><dt>RG</dt><dd>{employee.rg || 'Não informado'}</dd></div><div><dt>Nascimento</dt><dd>{employee.data_nascimento}</dd></div><div><dt>Localização</dt><dd>{employee.cidade} / {employee.estado}</dd></div><div><dt>Endereço</dt><dd>{employee.rua}, {employee.numero}</dd></div><div className="form-grid-wide"><dt>Complemento</dt><dd>{employee.complemento || 'Não informado'}</dd></div></dl>
}

export function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)
  const [modal, setModal] = useState<'create' | 'edit' | 'view' | null>(null)
  const [selected, setSelected] = useState<Employee | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadEmployees = useCallback(async () => { setError(null); try { setEmployees(await listEmployees()) } catch (loadError) { setError(getApiErrorMessage(loadError, 'Não foi possível carregar os funcionários.')) } finally { setLoading(false) } }, [])
  // oxlint-disable-next-line
  useEffect(() => { void loadEmployees() }, [loadEmployees])

  const saveEmployee = async (payload: EmployeePayload) => {
    setSaving(true); setFeedback(null)
    try { const saved = selected ? await updateEmployee(selected.id, payload) : await createEmployee(payload); setEmployees((current) => selected ? current.map((item) => item.id === saved.id ? saved : item) : [...current, saved]); setModal(null); setSelected(null); setFeedback({ kind: 'success', message: selected ? 'Funcionário atualizado com sucesso.' : 'Funcionário criado com sucesso.' }) } catch (saveError) { setFeedback({ kind: 'error', message: getApiErrorMessage(saveError, 'Não foi possível salvar o funcionário.') }) } finally { setSaving(false) }
  }

  const removeEmployee = async () => {
    if (!deleteTarget) return
    setDeleting(true); setFeedback(null)
    try { await deleteEmployee(deleteTarget.id); setEmployees((current) => current.filter((item) => item.id !== deleteTarget.id)); setFeedback({ kind: 'success', message: 'Funcionário excluído com sucesso.' }) } catch (deleteError) { setFeedback({ kind: 'error', message: getApiErrorMessage(deleteError, 'Não é possível excluir este funcionário porque há vendas relacionadas.') }) } finally { setDeleting(false); setDeleteTarget(null) }
  }

  const formValue = selected ? { ...selected } : emptyEmployee
  return <div className="crud-page">
    <div className="crud-page-header"><PageHeader eyebrow="Cadastros" title="Funcionários" description="Organize a equipe que participa da operação." /><button className="button button-primary" type="button" onClick={() => { setSelected(null); setModal('create'); setFeedback(null) }}>+ Novo funcionário</button></div>
    {feedback ? <FeedbackBanner kind={feedback.kind} message={feedback.message} onDismiss={() => setFeedback(null)} /> : null}
    {loading ? <LoadingState label="Carregando funcionários..." /> : error ? <ErrorState description={error} onRetry={() => { setLoading(true); void loadEmployees() }} /> : employees.length === 0 ? <div className="data-card"><EmptyState title="Nenhum funcionário cadastrado ainda" description="Crie o primeiro funcionário responsável pela operação." /></div> : <div className="data-card data-table-wrap"><table className="data-table"><thead><tr><th>Funcionário</th><th>CPF</th><th>Localização</th><th><span className="sr-only">Ações</span></th></tr></thead><tbody>{employees.map((employee) => <tr key={employee.id}><td className="data-primary">{employee.nome_completo}<span className="data-secondary">ID {employee.id}</span></td><td>{employee.cpf}</td><td>{employee.cidade} / {employee.estado}</td><td><div className="table-actions"><button className="table-action" type="button" onClick={() => { setSelected(employee); setModal('view') }}>Ver</button><button className="table-action" type="button" onClick={() => { setSelected(employee); setModal('edit') }}>Editar</button><button className="table-action table-action-danger" type="button" onClick={() => setDeleteTarget(employee)}>Excluir</button></div></td></tr>)}</tbody></table></div>}
    {modal === 'view' && selected ? <Modal title="Detalhes do funcionário" onClose={() => setModal(null)}><EmployeeDetails employee={selected} /></Modal> : null}
    {(modal === 'create' || modal === 'edit') ? <Modal title={modal === 'edit' ? 'Editar funcionário' : 'Novo funcionário'} description="RG e complemento são opcionais." onClose={() => setModal(null)}><EmployeeForm initialValue={formValue} saving={saving} onCancel={() => setModal(null)} onSave={(payload) => void saveEmployee(payload)} /></Modal> : null}
    {deleteTarget ? <ConfirmDialog title="Excluir funcionário?" description={`O cadastro de ${deleteTarget.nome_completo} será removido. Vendas relacionadas impedem a exclusão.`} busy={deleting} onCancel={() => setDeleteTarget(null)} onConfirm={() => void removeEmployee()} /> : null}
  </div>
}
