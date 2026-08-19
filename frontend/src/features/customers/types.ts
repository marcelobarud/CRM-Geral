export type Customer = {
  id: number
  nome: string
  cidade: string
  estado: string
  rua: string
  numero: string
  complemento: string | null
}

export type CustomerPayload = Omit<Customer, 'id'>
