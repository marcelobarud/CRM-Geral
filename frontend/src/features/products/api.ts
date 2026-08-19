import { request, requestJson } from '../../services/httpClient'
import { listSuppliers } from '../suppliers/api'
import type { Supplier } from '../suppliers/types'
import type { Product, ProductPayload } from './types'

export function listProducts(): Promise<Product[]> {
  return request<Product[]>('/api/products')
}

export function getProduct(id: number): Promise<Product> {
  return request<Product>(`/api/products/${id}`)
}

export function createProduct(payload: ProductPayload): Promise<Product> {
  return requestJson<Product>('/api/products', 'POST', payload)
}

export function updateProduct(
  id: number,
  payload: Partial<ProductPayload>,
): Promise<Product> {
  return requestJson<Product>(`/api/products/${id}`, 'PATCH', payload)
}

export function deleteProduct(id: number): Promise<void> {
  return request<unknown>(`/api/products/${id}`, { method: 'DELETE' }).then(() => undefined)
}

export function listProductSuppliers(): Promise<Supplier[]> {
  return listSuppliers()
}
