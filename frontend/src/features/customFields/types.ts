export type CustomFieldType = 'text' | 'integer' | 'decimal' | 'date' | 'boolean' | 'select'

export type CustomFieldDefinition = {
  id: number
  nome: string
  tipo: CustomFieldType
  opcoes: string[]
  obrigatorio: boolean
  ativo: boolean
  ordem: number
}

export type CustomFieldValue = CustomFieldDefinition & {
  campo_id: number
  valor: string | number | boolean | null
}

export type CustomFieldModule = 'customers' | 'products' | 'employees' | 'suppliers'

export type CustomFieldDefinitionPayload = {
  nome: string
  tipo: CustomFieldType
  opcoes: string[]
  obrigatorio: boolean
  ativo: boolean
  ordem: number
}
