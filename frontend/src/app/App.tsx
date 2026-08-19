import { useCallback, useEffect, useState } from 'react'

import { AppLayout } from '../components/AppLayout'
import { DashboardPage } from '../features/dashboard/DashboardPage'
import { CustomersPage } from '../features/customers/CustomersPage'
import { EmployeesPage } from '../features/employees/EmployeesPage'
import { ProductsPage } from '../features/products/ProductsPage'
import { NewSalePage, SalesPage } from '../features/sales/SalesPages'
import { SuppliersPage } from '../features/suppliers/SuppliersPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { getRoute, type RouteDefinition } from './routes'

function currentPathname(): string {
  return window.location.pathname || '/'
}

function PageForRoute({ route }: { route: RouteDefinition }) {
  switch (route.path) {
    case '/':
      return <DashboardPage />
    case '/customers':
      return <CustomersPage />
    case '/products':
      return <ProductsPage />
    case '/suppliers':
      return <SuppliersPage />
    case '/employees':
      return <EmployeesPage />
    case '/sales/new':
      return <NewSalePage />
    case '/sales':
      return <SalesPage />
    default:
      return <NotFoundPage />
  }
}

function App() {
  const [pathname, setPathname] = useState(currentPathname)

  useEffect(() => {
    const handlePopState = () => setPathname(currentPathname())
    window.addEventListener('popstate', handlePopState)

    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigate = useCallback(
    (path: string) => {
      if (path === pathname) return

      window.history.pushState({}, '', path)
      setPathname(path)
    },
    [pathname],
  )

  const route = getRoute(pathname)

  return (
    <AppLayout route={route} onNavigate={navigate}>
      <PageForRoute route={route} />
    </AppLayout>
  )
}

export default App
