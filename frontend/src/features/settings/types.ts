export type AppearanceLabels = {
  dashboard: string
  customers: string
  products: string
  employees: string
  suppliers: string
  sales: string
  newSale: string
}

export type AppearanceConfig = {
  id: number
  nome_sistema: string
  logo_url: string | null
  cor_primaria: string
  cor_secundaria: string
  cor_destaque: string
  cor_fundo: string
  cor_superficie: string
  cor_texto: string
  raio_controle: string
  raio_card: string
  rotulo_dashboard: string
  rotulo_clientes: string
  rotulo_produtos: string
  rotulo_funcionarios: string
  rotulo_fornecedores: string
  rotulo_vendas: string
  rotulo_nova_venda: string
}

export type AppearancePatch = Partial<Omit<AppearanceConfig, 'id' | 'logo_url'>>

export const defaultAppearance: AppearanceConfig = {
  id: 1,
  nome_sistema: 'CRM Geral',
  logo_url: null,
  cor_primaria: '#487A98',
  cor_secundaria: '#2F5975',
  cor_destaque: '#2F8065',
  cor_fundo: '#EEF4F8',
  cor_superficie: '#FFFFFF',
  cor_texto: '#1E293B',
  raio_controle: '0.75rem',
  raio_card: '1.5rem',
  rotulo_dashboard: 'Dashboard',
  rotulo_clientes: 'Clientes',
  rotulo_produtos: 'Produtos',
  rotulo_funcionarios: 'Funcionários',
  rotulo_fornecedores: 'Fornecedores',
  rotulo_vendas: 'Vendas',
  rotulo_nova_venda: 'Nova venda',
}

export function appearanceLabels(appearance: AppearanceConfig): AppearanceLabels {
  return {
    dashboard: appearance.rotulo_dashboard,
    customers: appearance.rotulo_clientes,
    products: appearance.rotulo_produtos,
    employees: appearance.rotulo_funcionarios,
    suppliers: appearance.rotulo_fornecedores,
    sales: appearance.rotulo_vendas,
    newSale: appearance.rotulo_nova_venda,
  }
}
