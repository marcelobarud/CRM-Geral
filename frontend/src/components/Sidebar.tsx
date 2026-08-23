import type { NavigationGroup } from '../app/routes'

type SidebarProps = {
  groups: NavigationGroup[]
  currentPath: string
  isOpen: boolean
  onNavigate: (path: string) => void
  brandName: string
  logoUrl: string | null
}

function isActivePath(currentPath: string, itemPath: string): boolean {
  if (itemPath === '/') return currentPath === '/'
  return currentPath === itemPath
}

export function Sidebar({
  groups,
  currentPath,
  isOpen,
  onNavigate,
  brandName,
  logoUrl,
}: SidebarProps) {
  return (
    <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
      <div className="brand-lockup">
        {logoUrl ? <img className="brand-logo" src={logoUrl} alt="Logo do sistema" /> : <span className="brand-mark" aria-hidden="true">C</span>}
        <div>
          <strong>{brandName}</strong>
          <span>Gestão simples</span>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Navegação principal">
        {groups.map((group) => (
          <div className="nav-group" key={group.label}>
            <p className="nav-group-label">{group.label}</p>
            {group.items.map((item) => {
              const active = isActivePath(currentPath, item.path)

              return (
                <a
                  className={`nav-link ${active ? 'nav-link-active' : ''}`}
                  href={item.path}
                  key={item.path}
                  aria-current={active ? 'page' : undefined}
                  onClick={(event) => {
                    event.preventDefault()
                    onNavigate(item.path)
                  }}
                >
                  <span className="nav-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </a>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-note">
        <span className="sidebar-note-dot" aria-hidden="true" />
        <div>
          <strong>Fundação V1</strong>
          <span>Seu espaço de gestão está tomando forma.</span>
        </div>
      </div>
    </aside>
  )
}
