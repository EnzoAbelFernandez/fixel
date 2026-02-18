import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const icons = {
  venta: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  ),
  productos: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  combos: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
    </svg>
  ),
  garantias: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  reportes: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  usuarios: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
}

const cards = [
  { to: '/ventas', key: 'venta', title: 'Nueva venta', label: 'Registrar una venta', accent: 'success', icon: icons.venta },
  { to: '/productos', key: 'productos', title: 'Productos', label: 'Ver inventario', accent: 'accent', icon: icons.productos },
  { to: '/combos', key: 'combos', title: 'Combos', label: 'Productos combinados', accent: 'accent', icon: icons.combos },
  { to: '/garantias', key: 'garantias', title: 'Garantías', label: 'Registrar pérdida o garantía', accent: 'danger', icon: icons.garantias, adminOnly: true },
  { to: '/reportes', key: 'reportes', title: 'Reportes', label: 'Ventas, pérdidas y balance', accent: 'accent', icon: icons.reportes, adminOnly: true },
  { to: '/usuarios', key: 'usuarios', title: 'Usuarios', label: 'Gestionar equipo', accent: 'accent', icon: icons.usuarios, adminOnly: true },
]

export default function Dashboard() {
  const { user, isAdmin } = useAuth()
  const visibleCards = cards.filter((c) => !c.adminOnly || isAdmin)

  return (
    <div className="dashboard">
      <header className="dashboard-welcome">
        <h1 className="dashboard-title">Hola, {user?.nombre}</h1>
        <p className="dashboard-subtitle">¿Qué quieres hacer hoy?</p>
      </header>

      <div className="dashboard-grid">
        {visibleCards.map(({ to, key, title, label, accent, icon }) => (
          <Link
            key={key}
            to={to}
            className={`dashboard-card dashboard-card--${accent}`}
            aria-label={`Ir a ${title}: ${label}`}
          >
            <span className="dashboard-card-icon" aria-hidden>
              {icon}
            </span>
            <div className="dashboard-card-content">
              <span className="dashboard-card-title">{title}</span>
              <span className="dashboard-card-label">{label}</span>
            </div>
            <span className="dashboard-card-arrow" aria-hidden>→</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
