import type { CustomFieldValue } from '../customFields/types'

export type Supplier = {
  id: number
  nome: string
  cidade: string
  estado: string
  rua: string
  numero: string
  complemento: string | null
  cnpj: string
  campos_personalizados?: CustomFieldValue[]
}

export type SupplierProduct = {
  id: number
  nome: string
}

export type SupplierDetails = Supplier & {
  produtos: SupplierProduct[]
}

export type SupplierPayload = Omit<Supplier, 'id' | 'campos_personalizados'> & { campos_personalizados?: Record<string, unknown> }
