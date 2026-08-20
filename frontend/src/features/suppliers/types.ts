export type Supplier = {
  id: number
  nome: string
  cidade: string
  estado: string
  rua: string
  numero: string
  complemento: string | null
  cnpj: string
}

export type SupplierProduct = {
  id: number
  nome: string
}

export type SupplierDetails = Supplier & {
  produtos: SupplierProduct[]
}

export type SupplierPayload = Omit<Supplier, 'id'>
