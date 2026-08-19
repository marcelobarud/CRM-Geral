import { FeaturePlaceholder } from '../../components/FeaturePlaceholder'

export function NewSalePage() {
  return (
    <FeaturePlaceholder
      eyebrow="Vendas"
      title="Nova venda"
      description="A criação de vendas será construída na próxima etapa."
      emptyTitle="Fluxo de venda em preparação"
      emptyDescription="A operação de vendas ficará disponível na fase de interface de vendas."
      icon="+"
    />
  )
}

export function SalesPage() {
  return (
    <FeaturePlaceholder
      eyebrow="Vendas"
      title="Vendas"
      description="O histórico de vendas será exibido nesta área."
      emptyTitle="Histórico de vendas em preparação"
      emptyDescription="A consulta de vendas será construída na fase de interface de vendas."
      icon="↗"
    />
  )
}
