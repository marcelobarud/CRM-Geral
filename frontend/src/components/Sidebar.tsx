import type { NavigationGroup } from '../app/routes'
import { useCustomizable } from '../features/settings/VisualCustomizationContext'

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
  const sidebarCustomization = useCustomizable({ key: 'global.sidebar', type: 'SURFACE', group: 'sidebar', label: 'Barra lateral' })
  const brandCustomization = useCustomizable({ key: 'global.sidebar.brand', type: 'TEXT', group: 'sidebar-brand', label: brandName })
  const noteCustomization = useCustomizable({ key: 'global.sidebar.note', type: 'SURFACE', group: 'sidebar-note', label: 'Nota da barra lateral' })
  return (
    <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`} {...sidebarCustomization}>
      <div className="brand-lockup" {...brandCustomization}>
        {logoUrl ? <img className="brand-logo" data-customization-role="logo" src={logoUrl} alt="Logo do sistema" /> : <span className="brand-mark" data-customization-role="logo" aria-hidden="true">C</span>}
        <div>
          <strong data-customization-role="name">{brandName}</strong>
          <span data-customization-role="subtitle">Gestão simples</span>
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

      <div className="sidebar-note" {...noteCustomization}>
        <span className="sidebar-note-dot" aria-hidden="true" />
        <div>
          <strong>Fundação V1</strong>
          <span>Seu espaço de gestão está tomando forma.</span>
        </div>
      </div>
    </aside>
  )
}
