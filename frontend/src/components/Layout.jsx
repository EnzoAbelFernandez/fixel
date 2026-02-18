import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className={`app ${!sidebarOpen ? 'sidebar-closed' : ''}`}>
      <button
        className="sidebar-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        title={sidebarOpen ? 'Ocultar menú' : 'Mostrar menú'}
        aria-label={sidebarOpen ? 'Ocultar menú' : 'Mostrar menú'}
      >
        {sidebarOpen ? '‹' : '›'}
      </button>
      <aside className={`sidebar ${sidebarOpen ? '' : 'sidebar-hidden'}`}>
        <header className="sidebar-header">
          <div className="sidebar-brand">
            <img src="/favicon.png" alt="" className="sidebar-logo" aria-hidden />
            <h2 className="sidebar-title">Fixcel</h2>
          </div>
        </header>
        <nav className="sidebar-nav" aria-label="Principal">
          <NavLink to="/" end>Inicio</NavLink>
          <NavLink to="/productos">Productos</NavLink>
          <NavLink to="/combos">Combos</NavLink>
          <NavLink to="/ventas">Nueva venta</NavLink>
          {isAdmin && <NavLink to="/garantias">Garantías / Pérdidas</NavLink>}
          {isAdmin && <NavLink to="/reportes">Reportes</NavLink>}
          {isAdmin && <NavLink to="/usuarios">Usuarios</NavLink>}
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
