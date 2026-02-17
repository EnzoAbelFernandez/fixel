import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user, isAdmin } = useAuth()

  return (
    <>
      <h1 className="page-title">Hola, {user?.nombre}</h1>

      <div className="grid-2">
        <Link to="/ventas" className="stat-card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="value text-success">Nueva venta</div>
          <div className="label">Registrar una venta</div>
        </Link>
        <Link to="/productos" className="stat-card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="value">Productos</div>
          <div className="label">Ver inventario</div>
        </Link>
        <Link to="/combos" className="stat-card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="value">Combos</div>
          <div className="label">Productos combinados</div>
        </Link>
        <Link to="/garantias" className="stat-card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="value text-danger">Garantías</div>
          <div className="label">Registrar pérdida o garantía</div>
        </Link>
        {isAdmin && (
          <Link to="/reportes" className="stat-card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="value">Reportes</div>
            <div className="label">Ventas, pérdidas y balance</div>
          </Link>
        )}
        {isAdmin && (
          <Link to="/usuarios" className="stat-card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="value">Usuarios</div>
            <div className="label">Gestionar equipo</div>
          </Link>
        )}
      </div>
    </>
  )
}
