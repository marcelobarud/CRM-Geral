import type { CustomFieldValue } from '../customFields/types'

export type MoneyValue = string | number

export type Product = {
  id: number
  nome: string
  categoria: string
  preco_custo: MoneyValue
  preco_venda: MoneyValue
  fornecedor_id: number
  campos_personalizados?: CustomFieldValue[]
}

export type ProductPayload = Omit<Product, 'id' | 'campos_personalizados'> & { campos_personalizados?: Record<string, unknown> }
