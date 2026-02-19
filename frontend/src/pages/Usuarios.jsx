import { useState, useEffect } from 'react'
import { usuarios } from '../api/client'

export default function Usuarios() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ nombre: '', email: '', password: '', rol: 'Vendedor' })

  const load = async () => {
    try {
      const { data } = await usuarios.list()
      setItems(data)
    } catch (e) {
      setError(e.response?.data?.msg || 'Error al cargar')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ nombre: '', email: '', password: '', rol: 'Vendedor' })
    setShowModal(true)
  }

  const openEdit = (u) => {
    setEditing(u)
    setForm({ nombre: u.nombre, email: u.email, password: '', rol: u.rol })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const payload = { ...form }
      if (!payload.password) delete payload.password
      if (editing) {
        await usuarios.update(editing._id, payload)
      } else {
        if (!payload.password) {
          setError('La contraseña es obligatoria para nuevos usuarios')
          return
        }
        await usuarios.create(payload)
      }
      setShowModal(false)
      load()
    } catch (e) {
      setError(e.response?.data?.msg || 'Error al guardar')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este usuario?')) return
    try {
      await usuarios.delete(id)
      load()
    } catch (e) {
      setError(e.response?.data?.msg || 'Error al eliminar')
    }
  }

  return (
    <>
      <div className="productos-header">
        <h1 className="page-title">Usuarios</h1>
        <div className="productos-actions">
          <button type="button" onClick={openCreate}>Nuevo usuario</button>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      {loading ? (
        <div className="productos-loading">
          <span className="productos-loading-text">Cargando usuarios...</span>
        </div>
      ) : (
        <div className="productos-card">
          <div className="productos-table-wrap">
            <table className="productos-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th className="productos-th-actions">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((u) => (
                  <tr key={u._id}>
                    <td className="productos-cell-name">{u.nombre}</td>
                    <td className="productos-cell-code">{u.email}</td>
                    <td>
                      <span className={`badge ${u.rol === 'Administrador' ? 'admin' : 'vendedor'}`}>
                        {u.rol}
                      </span>
                    </td>
                    <td>{u.activo !== false ? 'Activo' : 'Inactivo'}</td>
                    <td className="productos-cell-actions">
                      <button type="button" className="productos-btn productos-btn-edit" onClick={() => openEdit(u)} title="Editar">
                        Editar
                      </button>
                      <button type="button" className="productos-btn productos-btn-delete" onClick={() => handleDelete(u._id)} title="Eliminar">
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {items.length === 0 && (
            <div className="productos-empty">No hay usuarios registrados.</div>
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editing ? 'Editar usuario' : 'Nuevo usuario'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nombre *</label>
                <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required disabled={!!editing} />
              </div>
              <div className="form-group">
                <label>Contraseña {editing ? '(dejar vacío para no cambiar)' : '*'}</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={editing ? '••••••••' : ''} />
              </div>
              <div className="form-group">
                <label>Rol</label>
                <select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}>
                  <option value="Vendedor">Vendedor</option>
                  <option value="Administrador">Administrador</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit">{editing ? 'Guardar' : 'Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
