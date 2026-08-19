export type Employee = {
  id: number
  nome_completo: string
  cidade: string
  estado: string
  rua: string
  numero: string
  complemento: string | null
  cpf: string
  rg: string | null
  data_nascimento: string
}

export type EmployeePayload = Omit<Employee, 'id'>
