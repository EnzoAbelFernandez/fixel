import { useState, useEffect } from 'react'
import { combos, productos } from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function Combos() {
  const [items, setItems] = useState([])
  const [productosList, setProductosList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ nombre: '', precioVenta: '', items: [] })
  const { isAdmin } = useAuth()

  const load = async () => {
    try {
      const { data } = await combos.list()
      setItems(data)
    } catch (e) {
      setError(e.response?.data?.msg || 'Error al cargar combos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    productos.list().then(({ data }) => setProductosList(data))
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ nombre: '', precioVenta: '', items: [{ productoId: '', cantidad: 1 }] })
    setShowModal(true)
  }

  const openEdit = (c) => {
    setEditing(c)
    setForm({
      nombre: c.nombre,
      precioVenta: c.precioVenta,
      items: (c.items || []).map((it) => ({ productoId: it.producto?._id || it.producto, cantidad: it.cantidad }))
    })
    setShowModal(true)
  }

  const addItem = () => {
    setForm({ ...form, items: [...form.items, { productoId: '', cantidad: 1 }] })
  }

  const removeItem = (idx) => {
    setForm({ ...form, items: form.items.filter((_, i) => i !== idx) })
  }

  const updateItem = (idx, field, value) => {
    const n = [...form.items]
    n[idx] = { ...n[idx], [field]: field === 'cantidad' ? parseInt(value, 10) || 1 : value }
    setForm({ ...form, items: n })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const itemsValid = form.items.filter((it) => it.productoId && it.cantidad > 0).map((it) => ({ producto: it.productoId, cantidad: it.cantidad }))
    if (itemsValid.length === 0) {
      setError('Agregá al menos un producto al combo')
      return
    }
    try {
      const payload = { nombre: form.nombre, precioVenta: parseFloat(form.precioVenta) || 0, items: itemsValid }
      if (editing) await combos.update(editing._id, payload)
      else await combos.create(payload)
      setShowModal(false)
      load()
    } catch (e) {
      setError(e.response?.data?.msg || 'Error al guardar')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este combo?')) return
    try {
      await combos.delete(id)
      load()
    } catch (e) {
      setError(e.response?.data?.msg || 'Error al eliminar')
    }
  }

  return (
    <>
      <div className="flex mb-2" style={{ justifyContent: 'space-between' }}>
        <h1 className="page-title">Combos</h1>
        {isAdmin && <button onClick={openCreate}>Nuevo combo</button>}
      </div>

      {error && <div className="alert error">{error}</div>}

      {loading ? (
        <p className="text-muted">Cargando...</p>
      ) : (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Productos</th>
                <th>Precio</th>
                {isAdmin && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c._id}>
                  <td>{c.nombre}</td>
                  <td>
                    {(c.items || []).map((it) => `${it.producto?.nombre || '-'} x${it.cantidad}`).join(', ')}
                  </td>
                  <td>${c.precioVenta?.toLocaleString()}</td>
                  {isAdmin && (
                    <td>
                      <button className="secondary" style={{ padding: '6px 12px', marginRight: 8 }} onClick={() => openEdit(c)}>Editar</button>
                      <button className="danger" style={{ padding: '6px 12px' }} onClick={() => handleDelete(c._id)}>Eliminar</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && <p className="text-muted" style={{ padding: 20 }}>No hay combos</p>}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <h3>{editing ? 'Editar combo' : 'Nuevo combo'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nombre *</label>
                <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Precio venta *</label>
                <input type="number" step="0.01" value={form.precioVenta} onChange={(e) => setForm({ ...form, precioVenta: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Productos del combo</label>
                {form.items.map((it, idx) => (
                  <div key={idx} className="flex mb-1" style={{ gap: 8, alignItems: 'center' }}>
                    <select
                      value={it.productoId}
                      onChange={(e) => updateItem(idx, 'productoId', e.target.value)}
                      style={{ flex: 2 }}
                    >
                      <option value="">Seleccionar producto</option>
                      {productosList.map((p) => (
                        <option key={p._id} value={p._id}>{p.nombre} (stock: {p.stock})</option>
                      ))}
                    </select>
                    <input type="number" min="1" value={it.cantidad} onChange={(e) => updateItem(idx, 'cantidad', e.target.value)} style={{ width: 80 }} />
                    <button type="button" className="danger" style={{ padding: '6px 12px' }} onClick={() => removeItem(idx)}>×</button>
                  </div>
                ))}
                <button type="button" className="secondary" onClick={addItem}>+ Agregar producto</button>
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
