import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Layout({ children }) {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <h2>Fixcel</h2>
        <NavLink to="/">Inicio</NavLink>
        <NavLink to="/productos">Productos</NavLink>
        <NavLink to="/combos">Combos</NavLink>
        <NavLink to="/ventas">Nueva venta</NavLink>
        <NavLink to="/garantias">Garantías / Pérdidas</NavLink>
        {isAdmin && <NavLink to="/reportes">Reportes</NavLink>}
        {isAdmin && <NavLink to="/usuarios">Usuarios</NavLink>}
        <div className="spacer" />
        <div className="flex" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <span className="text-muted" style={{ fontSize: '0.85rem', padding: '8px 0' }}>
            {user?.nombre}
          </span>
          <span className={`badge ${user?.rol === 'Administrador' ? 'admin' : 'vendedor'}`}>
            {user?.rol}
          </span>
          <button className="secondary mt-2" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  )
}
