export type DecimalValue = string | number

export type SaleItemCreate = {
  produto_id: number
  quantidade: string
}

export type SaleCreatePayload = {
  cliente_id: number
  funcionario_id: number
  data_venda: string
  itens: SaleItemCreate[]
}

export type SaleCustomerSummary = {
  id: number
  nome: string
}

export type SaleEmployeeSummary = {
  id: number
  nome_completo: string
}

export type SaleProductSummary = {
  id: number
  nome: string
}

export type SaleSupplierSummary = {
  id: number
  nome: string
}

export type SaleItem = {
  id: number
  produto: SaleProductSummary
  fornecedor_id: number
  fornecedor: SaleSupplierSummary
  quantidade: DecimalValue
  preco_unitario: DecimalValue
  subtotal: DecimalValue
}

export type Sale = {
  id: number
  data_venda: string
  cliente: SaleCustomerSummary
  funcionario: SaleEmployeeSummary
  itens: SaleItem[]
  total: DecimalValue
}
