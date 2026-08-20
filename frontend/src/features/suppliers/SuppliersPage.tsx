import { useCallback, useEffect, useState, type FormEvent } from 'react'

import { ConfirmDialog } from '../../components/ConfirmDialog'
import { EmptyState } from '../../components/EmptyState'
import { ErrorState } from '../../components/ErrorState'
import { FeedbackBanner } from '../../components/FeedbackBanner'
import { LoadingState } from '../../components/LoadingState'
import { Modal } from '../../components/Modal'
import { PageHeader } from '../../components/PageHeader'
import { getApiErrorMessage } from '../../services/httpClient'
import { createSupplier, deleteSupplier, getSupplier, listSuppliers, updateSupplier } from './api'
import type { Supplier, SupplierDetails, SupplierPayload } from './types'

const emptySupplier: SupplierPayload = { nome: '', cidade: '', estado: '', rua: '', numero: '', complemento: '', cnpj: '' }

function SupplierForm({ initialValue, saving, onCancel, onSave }: { initialValue: SupplierPayload; saving: boolean; onCancel: () => void; onSave: (payload: SupplierPayload) => void }) {
  const [form, setForm] = useState({ ...initialValue, complemento: initialValue.complemento ?? '' })
  const updateField = (field: keyof SupplierPayload, value: string) => setForm((current) => ({ ...current, [field]: value }))
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); onSave({ ...form, complemento: form.complemento.trim() || null }) }

  return <form onSubmit={submit}><div className="form-grid">
    <div className="form-field form-grid-wide"><label htmlFor="supplier-name">Nome</label><input id="supplier-name" required value={form.nome} onChange={(event) => updateField('nome', event.target.value)} /></div>
    <div className="form-field"><label htmlFor="supplier-cnpj">CNPJ</label><input id="supplier-cnpj" required value={form.cnpj} onChange={(event) => updateField('cnpj', event.target.value)} /></div>
    <div className="form-field"><label htmlFor="supplier-city">Cidade</label><input id="supplier-city" required value={form.cidade} onChange={(event) => updateField('cidade', event.target.value)} /></div>
    <div className="form-field"><label htmlFor="supplier-state">Estado</label><input id="supplier-state" required maxLength={2} value={form.estado} onChange={(event) => updateField('estado', event.target.value.toUpperCase())} /></div>
    <div className="form-field"><label htmlFor="supplier-street">Rua</label><input id="supplier-street" required value={form.rua} onChange={(event) => updateField('rua', event.target.value)} /></div>
    <div className="form-field"><label htmlFor="supplier-number">Número</label><input id="supplier-number" required value={form.numero} onChange={(event) => updateField('numero', event.target.value)} /></div>
    <div className="form-field form-grid-wide"><label htmlFor="supplier-complement">Complemento (opcional)</label><input id="supplier-complement" value={form.complemento ?? ''} onChange={(event) => updateField('complemento', event.target.value)} /></div>
  </div><div className="form-actions"><button className="button button-secondary" type="button" onClick={onCancel} disabled={saving}>Cancelar</button><button className="button button-primary" type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar fornecedor'}</button></div></form>
}

function SupplierDetails({ supplier }: { supplier: SupplierDetails }) {
  return <><dl className="detail-grid"><div><dt>Nome</dt><dd>{supplier.nome}</dd></div><div><dt>CNPJ</dt><dd>{supplier.cnpj}</dd></div><div><dt>Cidade / Estado</dt><dd>{supplier.cidade} / {supplier.estado}</dd></div><div><dt>Rua</dt><dd>{supplier.rua}, {supplier.numero}</dd></div><div className="form-grid-wide"><dt>Complemento</dt><dd>{supplier.complemento || 'Não informado'}</dd></div></dl><section className="relational-detail-section" aria-labelledby="supplier-products-title"><div className="relational-detail-heading"><h3 id="supplier-products-title">Produtos fornecidos</h3><span>{supplier.produtos.length} {supplier.produtos.length === 1 ? 'produto' : 'produtos'}</span></div>{supplier.produtos.length === 0 ? <p className="relational-detail-empty">Nenhum produto associado a este fornecedor.</p> : <ul className="relational-detail-list">{supplier.produtos.map((product) => <li className="relational-detail-item" key={product.id}><strong>{product.nome}</strong></li>)}</ul>}</section></>
}

export function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)
  const [modal, setModal] = useState<'create' | 'edit' | 'view' | null>(null)
  const [selected, setSelected] = useState<Supplier | null>(null)
  const [selectedDetails, setSelectedDetails] = useState<SupplierDetails | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadSuppliers = useCallback(async () => { setError(null); try { setSuppliers(await listSuppliers()) } catch (loadError) { setError(getApiErrorMessage(loadError, 'Não foi possível carregar os fornecedores.')) } finally { setLoading(false) } }, [])
  // oxlint-disable-next-line
  useEffect(() => { void loadSuppliers() }, [loadSuppliers])

  const openSupplierDetails = async (supplier: Supplier) => {
    setSelected(supplier)
    setSelectedDetails(null)
    setDetailsError(null)
    setDetailsLoading(true)
    setModal('view')
    try {
      setSelectedDetails(await getSupplier(supplier.id))
    } catch (loadError) {
      setDetailsError(getApiErrorMessage(loadError, 'Não foi possível carregar os detalhes do fornecedor.'))
    } finally {
      setDetailsLoading(false)
    }
  }

  const saveSupplier = async (payload: SupplierPayload) => {
    setSaving(true); setFeedback(null)
    try { const saved = selected ? await updateSupplier(selected.id, payload) : await createSupplier(payload); setSuppliers((current) => selected ? current.map((item) => item.id === saved.id ? saved : item) : [...current, saved]); setModal(null); setSelected(null); setFeedback({ kind: 'success', message: selected ? 'Fornecedor atualizado com sucesso.' : 'Fornecedor criado com sucesso.' }) } catch (saveError) { setFeedback({ kind: 'error', message: getApiErrorMessage(saveError, 'Não foi possível salvar o fornecedor.') }) } finally { setSaving(false) }
  }

  const removeSupplier = async () => {
    if (!deleteTarget) return
    setDeleting(true); setFeedback(null)
    try { await deleteSupplier(deleteTarget.id); setSuppliers((current) => current.filter((item) => item.id !== deleteTarget.id)); setFeedback({ kind: 'success', message: 'Fornecedor excluído com sucesso.' }) } catch (deleteError) { setFeedback({ kind: 'error', message: getApiErrorMessage(deleteError, 'Não é possível excluir este fornecedor porque há produtos relacionados.') }) } finally { setDeleting(false); setDeleteTarget(null) }
  }

  const formValue: SupplierPayload = selected
    ? (({ id: _id, ...payload }) => payload)(selected)
    : emptySupplier
  return <div className="crud-page">
    <div className="crud-page-header"><PageHeader eyebrow="Cadastros" title="Fornecedores" description="Mantenha os parceiros do seu negócio organizados." /><button className="button button-primary" type="button" onClick={() => { setSelected(null); setModal('create'); setFeedback(null) }}>+ Novo fornecedor</button></div>
    {feedback ? <FeedbackBanner kind={feedback.kind} message={feedback.message} onDismiss={() => setFeedback(null)} /> : null}
    {loading ? <LoadingState label="Carregando fornecedores..." /> : error ? <ErrorState description={error} onRetry={() => { setLoading(true); void loadSuppliers() }} /> : suppliers.length === 0 ? <div className="data-card"><EmptyState title="Nenhum fornecedor cadastrado ainda" description="Crie o primeiro fornecedor para relacionar seus produtos." /></div> : <div className="data-card data-table-wrap"><table className="data-table"><thead><tr><th>Fornecedor</th><th>CNPJ</th><th>Localização</th><th><span className="sr-only">Ações</span></th></tr></thead><tbody>{suppliers.map((supplier) => <tr key={supplier.id}><td className="data-primary">{supplier.nome}<span className="data-secondary">ID {supplier.id}</span></td><td>{supplier.cnpj}</td><td>{supplier.cidade} / {supplier.estado}</td><td><div className="table-actions"><button className="table-action" type="button" onClick={() => void openSupplierDetails(supplier)}>Ver</button><button className="table-action" type="button" onClick={() => { setSelected(supplier); setModal('edit') }}>Editar</button><button className="table-action table-action-danger" type="button" onClick={() => setDeleteTarget(supplier)}>Excluir</button></div></td></tr>)}</tbody></table></div>}
    {modal === 'view' && selected ? <Modal title="Detalhes do fornecedor" size="large" onClose={() => { setModal(null); setSelectedDetails(null) }}>{detailsLoading ? <LoadingState label="Carregando detalhes do fornecedor..." /> : detailsError ? <ErrorState description={detailsError} onRetry={() => void openSupplierDetails(selected)} /> : selectedDetails ? <SupplierDetails supplier={selectedDetails} /> : null}</Modal> : null}
    {(modal === 'create' || modal === 'edit') ? <Modal title={modal === 'edit' ? 'Editar fornecedor' : 'Novo fornecedor'} description="O CNPJ é obrigatório e deve ser único." onClose={() => setModal(null)}><SupplierForm initialValue={formValue} saving={saving} onCancel={() => setModal(null)} onSave={(payload) => void saveSupplier(payload)} /></Modal> : null}
    {deleteTarget ? <ConfirmDialog title="Excluir fornecedor?" description={`O cadastro de ${deleteTarget.nome} será removido. Produtos relacionados impedem a exclusão.`} busy={deleting} onCancel={() => setDeleteTarget(null)} onConfirm={() => void removeSupplier()} /> : null}
  </div>
}
