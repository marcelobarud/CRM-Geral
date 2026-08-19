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

export type SupplierPayload = Omit<Supplier, 'id'>
