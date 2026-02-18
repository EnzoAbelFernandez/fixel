import { useState, useEffect, useRef } from 'react'
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
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState('')
  const overlayClickStarted = useRef(false)
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

  const filteredItems = items.filter(
    (c) => !search || c.nombre?.toLowerCase().includes(search.toLowerCase())
  )
  const formatPrecio = (n) => (n != null ? `$${Number(n).toLocaleString('es-CL')}` : '-')

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
    setSubmitting(true)
    try {
      const payload = { nombre: form.nombre, precioVenta: parseFloat(form.precioVenta) || 0, items: itemsValid }
      if (editing) await combos.update(editing._id, payload)
      else await combos.create(payload)
      setShowModal(false)
      load()
    } catch (e) {
      setError(e.response?.data?.msg || 'Error al guardar')
    } finally {
      setSubmitting(false)
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
      <div className="productos-header">
        <h1 className="page-title">Combos</h1>
        <div className="productos-actions">
          <button type="button" onClick={openCreate}>Nuevo combo</button>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      {loading ? (
        <div className="productos-loading">
          <span className="productos-loading-text">Cargando combos...</span>
        </div>
      ) : (
        <>
          <div className="productos-toolbar">
            <div className="productos-search-wrap">
              <span className="productos-search-icon" aria-hidden>⌕</span>
              <input
                type="search"
                className="productos-search"
                placeholder="Buscar por nombre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Buscar combos"
              />
            </div>
            <span className="productos-count">
              {filteredItems.length === items.length
                ? `${items.length} combo${items.length !== 1 ? 's' : ''}`
                : `${filteredItems.length} de ${items.length}`}
            </span>
          </div>

          <div className="productos-card">
            <div className="productos-table-wrap">
              <table className="productos-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Productos</th>
                    <th className="productos-th-num">Precio</th>
                    <th className="productos-th-actions">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((c) => (
                    <tr key={c._id}>
                      <td className="productos-cell-name">{c.nombre}</td>
                      <td>
                        <span className="productos-combo-items">
                          {(c.items || []).map((it) => `${it.producto?.nombre || '-'} ×${it.cantidad}`).join(', ')}
                        </span>
                      </td>
                      <td className="productos-cell-num productos-cell-precio">{formatPrecio(c.precioVenta)}</td>
                      <td className="productos-cell-actions">
                        <button type="button" className="productos-btn productos-btn-edit" onClick={() => openEdit(c)} title="Editar">
                          Editar
                        </button>
                        <button type="button" className="productos-btn productos-btn-delete" onClick={() => handleDelete(c._id)} title="Eliminar">
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredItems.length === 0 && (
              <div className="productos-empty">
                {items.length === 0
                  ? 'No hay combos. Crea uno para ofrecer productos combinados.'
                  : 'Ningún combo coincide con la búsqueda.'}
              </div>
            )}
          </div>
        </>
      )}

      {showModal && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => { if (e.target === e.currentTarget) overlayClickStarted.current = true }}
          onClick={(e) => {
            if (e.target === e.currentTarget && overlayClickStarted.current && !submitting) setShowModal(false)
            overlayClickStarted.current = false
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-combo-title"
        >
          <div
            className="modal modal-producto"
            onMouseDown={() => { overlayClickStarted.current = false }}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 520 }}
          >
            <div className="modal-header">
              <h3 id="modal-combo-title">{editing ? 'Editar combo' : 'Nuevo combo'}</h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => !submitting && setShowModal(false)}
                aria-label="Cerrar"
                disabled={submitting}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label htmlFor="combo-nombre">Nombre *</label>
                <input
                  id="combo-nombre"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej. Kit cables + funda"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="combo-precio">Precio venta *</label>
                <input
                  id="combo-precio"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.precioVenta}
                  onChange={(e) => setForm({ ...form, precioVenta: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="form-group">
                <label>Productos del combo</label>
                {form.items.map((it, idx) => (
                  <div key={idx} className="combos-form-row">
                    <select
                      value={it.productoId}
                      onChange={(e) => updateItem(idx, 'productoId', e.target.value)}
                      aria-label={`Producto ${idx + 1}`}
                    >
                      <option value="">Seleccionar producto</option>
                      {productosList.map((p) => (
                        <option key={p._id} value={p._id}>{p.nombre} (stock: {p.stock})</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      value={it.cantidad}
                      onChange={(e) => updateItem(idx, 'cantidad', e.target.value)}
                      aria-label={`Cantidad ${idx + 1}`}
                      className="combos-input-cant"
                    />
                    <button type="button" className="productos-btn productos-btn-delete" onClick={() => removeItem(idx)} title="Quitar">
                      ×
                    </button>
                  </div>
                ))}
                <button type="button" className="secondary" onClick={addItem}>+ Agregar producto</button>
              </div>
              <div className="modal-actions">
                <button type="button" className="secondary" onClick={() => !submitting && setShowModal(false)} disabled={submitting}>
                  Cancelar
                </button>
                <button type="submit" disabled={submitting}>
                  {submitting ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear combo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
