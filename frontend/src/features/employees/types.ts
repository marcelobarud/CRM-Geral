import type { CustomFieldValue } from '../customFields/types'

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
  campos_personalizados?: CustomFieldValue[]
}

export type EmployeePayload = Omit<Employee, 'id' | 'ativo' | 'campos_personalizados'> & { ativo?: boolean; campos_personalizados?: Record<string, unknown> }
