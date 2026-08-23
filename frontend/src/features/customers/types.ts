import type { CustomFieldValue } from '../customFields/types'

export type Customer = {
  id: number
  nome: string
  cidade: string
  estado: string
  rua: string
  numero: string
  complemento: string | null
  campos_personalizados?: CustomFieldValue[]
}

export type CustomerPurchasedProduct = {
  produto_id: number
  nome: string
  quantidade: string
}

export type CustomerDetails = Customer & {
  produtos_comprados: CustomerPurchasedProduct[]
}

export type CustomerPayload = Omit<Customer, 'id' | 'campos_personalizados'> & { campos_personalizados?: Record<string, unknown> }
