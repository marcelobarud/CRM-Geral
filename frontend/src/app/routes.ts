export type NavigationItem = {
  path: string
  label: string
  icon: string
}

export type NavigationGroup = {
  label: string
  items: NavigationItem[]
}

export type RouteDefinition = NavigationItem & {
  description: string
}

export const navigationGroups: NavigationGroup[] = [
  {
    label: 'Visão geral',
    items: [{ path: '/', label: 'Dashboard', icon: '⌂' }],
  },
  {
    label: 'Cadastros',
    items: [
      { path: '/customers', label: 'Clientes', icon: '◎' },
      { path: '/products', label: 'Produtos', icon: '▦' },
      { path: '/suppliers', label: 'Fornecedores', icon: '◈' },
      { path: '/employees', label: 'Funcionários', icon: '♙' },
    ],
  },
  {
    label: 'Vendas',
    items: [
      { path: '/sales/new', label: 'Nova venda', icon: '+' },
      { path: '/sales', label: 'Vendas', icon: '↗' },
    ],
  },
]

const routeDescriptions: Record<string, string> = {
  '/': 'Uma visão tranquila para acompanhar o dia e acessar suas principais áreas.',
  '/customers': 'A base para organizar seus clientes estará disponível aqui.',
  '/products': 'O catálogo de produtos do seu negócio ficará centralizado aqui.',
  '/suppliers': 'Seus fornecedores poderão ser acompanhados nesta área.',
  '/employees': 'A equipe responsável pela operação será organizada aqui.',
  '/sales/new': 'A criação de vendas será construída na próxima etapa.',
  '/sales': 'O histórico de vendas será exibido nesta área.',
}

const routeItems = navigationGroups.flatMap((group) => group.items)

export const notFoundRoute: RouteDefinition = {
  path: '/not-found',
  label: 'Página não encontrada',
  icon: '?',
  description: 'A página que você tentou acessar não existe.',
}

export function getRoute(pathname: string): RouteDefinition {
  const normalizedPath = pathname.replace(/\/$/, '') || '/'
  const item = routeItems.find((candidate) => candidate.path === normalizedPath)

  if (!item) return notFoundRoute

  return {
    ...item,
    description: routeDescriptions[item.path],
  }
}
