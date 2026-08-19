import { useCallback, useEffect, useState, type FormEvent } from 'react'

import { ConfirmDialog } from '../../components/ConfirmDialog'
import { EmptyState } from '../../components/EmptyState'
import { ErrorState } from '../../components/ErrorState'
import { FeedbackBanner } from '../../components/FeedbackBanner'
import { LoadingState } from '../../components/LoadingState'
import { Modal } from '../../components/Modal'
import { PageHeader } from '../../components/PageHeader'
import { getApiErrorMessage } from '../../services/httpClient'
import { listProductSuppliers, createProduct, deleteProduct, listProducts, updateProduct } from './api'
import type { Product, ProductPayload } from './types'
import type { Supplier } from '../suppliers/types'

const emptyProduct: ProductPayload = { nome: '', categoria: '', preco_custo: '', preco_venda: '', fornecedor_id: 0 }

function displayMoney(value: string | number): string {
  return `R$ ${String(value).replace('.', ',')}`
}

function ProductForm({ initialValue, suppliers, saving, onCancel, onSave }: { initialValue: ProductPayload; suppliers: Supplier[]; saving: boolean; onCancel: () => void; onSave: (payload: ProductPayload) => void }) {
  const [form, setForm] = useState(initialValue)
  const updateText = (field: 'nome' | 'categoria' | 'preco_custo' | 'preco_venda', value: string) => setForm((current) => ({ ...current, [field]: value }))
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); onSave(form) }

  return <form onSubmit={submit}><div className="form-grid">
    <div className="form-field form-grid-wide"><label htmlFor="product-name">Nome</label><input id="product-name" required value={form.nome} onChange={(event) => updateText('nome', event.target.value)} /></div>
    <div className="form-field"><label htmlFor="product-category">Categoria</label><input id="product-category" required value={form.categoria} onChange={(event) => updateText('categoria', event.target.value)} /></div>
    <div className="form-field"><label htmlFor="product-supplier">Fornecedor</label><select id="product-supplier" required value={form.fornecedor_id || ''} onChange={(event) => setForm((current) => ({ ...current, fornecedor_id: Number(event.target.value) }))}><option value="" disabled>Selecione um fornecedor</option>{suppliers.map((supplier) => <option value={supplier.id} key={supplier.id}>{supplier.nome}</option>)}</select></div>
    <div className="form-field"><label htmlFor="product-cost">Preço de custo</label><input id="product-cost" required min="0" step="0.01" type="number" value={form.preco_custo} onChange={(event) => updateText('preco_custo', event.target.value)} /><span className="form-help">Use duas casas decimais.</span></div>
    <div className="form-field"><label htmlFor="product-price">Preço de venda</label><input id="product-price" required min="0" step="0.01" type="number" value={form.preco_venda} onChange={(event) => updateText('preco_venda', event.target.value)} /><span className="form-help">Use duas casas decimais.</span></div>
  </div><div className="form-actions"><button className="button button-secondary" type="button" onClick={onCancel} disabled={saving}>Cancelar</button><button className="button button-primary" type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar produto'}</button></div></form>
}

function ProductDetails({ product, supplierName }: { product: Product; supplierName: string }) {
  return <dl className="detail-grid"><div><dt>Nome</dt><dd>{product.nome}</dd></div><div><dt>Categoria</dt><dd>{product.categoria}</dd></div><div><dt>Fornecedor</dt><dd>{supplierName}</dd></div><div><dt>Preço de custo</dt><dd>{displayMoney(product.preco_custo)}</dd></div><div><dt>Preço de venda</dt><dd>{displayMoney(product.preco_venda)}</dd></div></dl>
}

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)
  const [modal, setModal] = useState<'create' | 'edit' | 'view' | null>(null)
  const [selected, setSelected] = useState<Product | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadProducts = useCallback(async () => { setError(null); try { const [productList, supplierList] = await Promise.all([listProducts(), listProductSuppliers()]); setProducts(productList); setSuppliers(supplierList) } catch (loadError) { setError(getApiErrorMessage(loadError, 'Não foi possível carregar produtos e fornecedores.')) } finally { setLoading(false) } }, [])
  // oxlint-disable-next-line
  useEffect(() => { void loadProducts() }, [loadProducts])

  const saveProduct = async (payload: ProductPayload) => {
    setSaving(true); setFeedback(null)
    try { const saved = selected ? await updateProduct(selected.id, payload) : await createProduct(payload); setProducts((current) => selected ? current.map((item) => item.id === saved.id ? saved : item) : [...current, saved]); setModal(null); setSelected(null); setFeedback({ kind: 'success', message: selected ? 'Produto atualizado com sucesso.' : 'Produto criado com sucesso.' }) } catch (saveError) { setFeedback({ kind: 'error', message: getApiErrorMessage(saveError, 'Não foi possível salvar o produto.') }) } finally { setSaving(false) }
  }

  const removeProduct = async () => {
    if (!deleteTarget) return
    setDeleting(true); setFeedback(null)
    try { await deleteProduct(deleteTarget.id); setProducts((current) => current.filter((item) => item.id !== deleteTarget.id)); setFeedback({ kind: 'success', message: 'Produto excluído com sucesso.' }) } catch (deleteError) { setFeedback({ kind: 'error', message: getApiErrorMessage(deleteError, 'Não é possível excluir este produto porque há itens de venda relacionados.') }) } finally { setDeleting(false); setDeleteTarget(null) }
  }

  const supplierName = (supplierId: number) => suppliers.find((supplier) => supplier.id === supplierId)?.nome || 'Fornecedor não encontrado'
  const formValue = selected ? { ...selected } : emptyProduct
  return <div className="crud-page">
    <div className="crud-page-header"><PageHeader eyebrow="Cadastros" title="Produtos" description="Mantenha seu catálogo e seus preços organizados." /><button className="button button-primary" type="button" onClick={() => { setSelected(null); setModal('create'); setFeedback(null) }}>+ Novo produto</button></div>
    {feedback ? <FeedbackBanner kind={feedback.kind} message={feedback.message} onDismiss={() => setFeedback(null)} /> : null}
    {loading ? <LoadingState label="Carregando produtos..." /> : error ? <ErrorState description={error} onRetry={() => { setLoading(true); void loadProducts() }} /> : products.length === 0 ? <div className="data-card"><EmptyState title="Nenhum produto cadastrado ainda" description="Crie um produto e selecione um fornecedor existente." /></div> : <div className="data-card data-table-wrap"><table className="data-table"><thead><tr><th>Produto</th><th>Categoria</th><th>Fornecedor</th><th>Preço de venda</th><th><span className="sr-only">Ações</span></th></tr></thead><tbody>{products.map((product) => <tr key={product.id}><td className="data-primary">{product.nome}<span className="data-secondary">ID {product.id}</span></td><td>{product.categoria}</td><td>{supplierName(product.fornecedor_id)}</td><td>{displayMoney(product.preco_venda)}</td><td><div className="table-actions"><button className="table-action" type="button" onClick={() => { setSelected(product); setModal('view') }}>Ver</button><button className="table-action" type="button" onClick={() => { setSelected(product); setModal('edit') }}>Editar</button><button className="table-action table-action-danger" type="button" onClick={() => setDeleteTarget(product)}>Excluir</button></div></td></tr>)}</tbody></table></div>}
    {modal === 'view' && selected ? <Modal title="Detalhes do produto" onClose={() => setModal(null)}><ProductDetails product={selected} supplierName={supplierName(selected.fornecedor_id)} /></Modal> : null}
    {(modal === 'create' || modal === 'edit') ? <Modal title={modal === 'edit' ? 'Editar produto' : 'Novo produto'} description="Selecione um fornecedor real e informe os valores com precisão." onClose={() => setModal(null)}><ProductForm initialValue={formValue} suppliers={suppliers} saving={saving} onCancel={() => setModal(null)} onSave={(payload) => void saveProduct(payload)} /></Modal> : null}
    {deleteTarget ? <ConfirmDialog title="Excluir produto?" description={`O cadastro de ${deleteTarget.nome} será removido. Itens de venda relacionados impedem a exclusão.`} busy={deleting} onCancel={() => setDeleteTarget(null)} onConfirm={() => void removeProduct()} /> : null}
  </div>
}
