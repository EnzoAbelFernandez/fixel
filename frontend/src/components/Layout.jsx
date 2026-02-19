import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true
    return !window.matchMedia('(max-width: 768px)').matches
  })
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    const handler = () => setSidebarOpen(!mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className={`app ${!sidebarOpen ? 'sidebar-closed' : ''}`}>
      <button
        className="sidebar-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        title={sidebarOpen ? 'Ocultar menú' : 'Mostrar menú'}
        aria-label={sidebarOpen ? 'Ocultar menú' : 'Mostrar menú'}
      >
        <span className="sidebar-toggle-icon sidebar-toggle-icon-desktop">{sidebarOpen ? '‹' : '›'}</span>
        <span className="sidebar-toggle-icon sidebar-toggle-icon-mobile">{sidebarOpen ? '×' : '☰'}</span>
      </button>
      {sidebarOpen && <div className="sidebar-backdrop" onClick={closeSidebar} aria-hidden />}
      <aside className={`sidebar ${sidebarOpen ? '' : 'sidebar-hidden'}`}>
        <header className="sidebar-header">
          <div className="sidebar-brand">
            <img src="/favicon.png" alt="" className="sidebar-logo" aria-hidden />
            <h2 className="sidebar-title">Fixcel</h2>
          </div>
        </header>
        <nav className="sidebar-nav" aria-label="Principal">
          <NavLink to="/" end onClick={closeSidebar}>Inicio</NavLink>
          <NavLink to="/productos" onClick={closeSidebar}>Productos</NavLink>
          <NavLink to="/combos" onClick={closeSidebar}>Combos</NavLink>
          <NavLink to="/ventas" onClick={closeSidebar}>Nueva venta</NavLink>
          {isAdmin && <NavLink to="/garantias" onClick={closeSidebar}>Garantías / Pérdidas</NavLink>}
          {isAdmin && <NavLink to="/reportes" onClick={closeSidebar}>Reportes</NavLink>}
          {isAdmin && <NavLink to="/usuarios" onClick={closeSidebar}>Usuarios</NavLink>}
        </nav>
        <div className="sidebar-spacer" aria-hidden />
        <div className="sidebar-user">
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user?.nombre}</span>
            <span className={`sidebar-badge ${user?.rol === 'Administrador' ? 'admin' : 'vendedor'}`}>
              {user?.rol}
            </span>
          </div>
          <button type="button" className="sidebar-logout" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  )
}
