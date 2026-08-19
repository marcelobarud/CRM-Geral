import { useState, type ReactNode } from 'react'

import { navigationGroups, type RouteDefinition } from '../app/routes'
import { useHealthStatus } from '../app/useHealthStatus'
import { Sidebar } from './Sidebar'

type AppLayoutProps = {
  route: RouteDefinition
  onNavigate: (path: string) => void
  children: ReactNode
}

function HealthIndicator() {
  const { status, retry } = useHealthStatus()

  if (status === 'loading') {
    return (
      <span className="health-indicator health-loading" role="status">
        <span className="health-dot" aria-hidden="true" />
        Verificando API
      </span>
    )
  }

  if (status === 'offline') {
    return (
      <button
        className="health-indicator health-offline"
        type="button"
        onClick={() => void retry()}
        title="Tentar conectar novamente"
      >
        <span className="health-dot" aria-hidden="true" />
        API indisponível
      </button>
    )
  }

  return (
    <span className="health-indicator health-online" role="status">
      <span className="health-dot" aria-hidden="true" />
      API online
    </span>
  )
}

export function AppLayout({ route, onNavigate, children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navigate = (path: string) => {
    onNavigate(path)
    setSidebarOpen(false)
  }

  return (
    <div className="app-frame">
      <Sidebar
        groups={navigationGroups}
        currentPath={route.path === '/not-found' ? '' : route.path}
        isOpen={sidebarOpen}
        onNavigate={navigate}
      />
      {sidebarOpen ? (
        <button
          className="sidebar-backdrop"
          type="button"
          aria-label="Fechar menu"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <div className="app-shell">
        <header className="topbar">
          <div className="topbar-leading">
            <button
              className="menu-button"
              type="button"
              aria-label={sidebarOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen((isOpen) => !isOpen)}
            >
              <span aria-hidden="true">☰</span>
            </button>
            <div>
              <p className="topbar-kicker">Área administrativa</p>
              <strong>{route.label}</strong>
            </div>
          </div>
          <HealthIndicator />
        </header>

        <main className="main-content">{children}</main>
      </div>
    </div>
  )
}
