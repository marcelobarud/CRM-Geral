export type MoneyValue = string | number

export type Product = {
  id: number
  nome: string
  categoria: string
  preco_custo: MoneyValue
  preco_venda: MoneyValue
  fornecedor_id: number
}

export type ProductPayload = Omit<Product, 'id'>
