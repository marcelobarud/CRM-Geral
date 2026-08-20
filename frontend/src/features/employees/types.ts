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
  ativo: boolean
}

export type EmployeePayload = Omit<Employee, 'id' | 'ativo'> & { ativo?: boolean }
