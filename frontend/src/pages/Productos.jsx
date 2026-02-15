import { useState, useEffect } from 'react'
import { productos, bulk } from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function Productos() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [uploading, setUploading] = useState(false)
  const { isAdmin } = useAuth()

  const [form, setForm] = useState({
    nombre: '', categoria: '', codigoBarras: '', costo: '', precioVenta: '', stock: 0
  })

  const load = async () => {
    try {
      const { data } = await productos.list()
      setItems(data)
    } catch (e) {
      setError(e.response?.data?.msg || 'Error al cargar productos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ nombre: '', categoria: '', codigoBarras: '', costo: '', precioVenta: '', stock: 0 })
    setShowModal(true)
  }

  const openEdit = (p) => {
    setEditing(p)
    setForm({
      nombre: p.nombre, categoria: p.categoria, codigoBarras: p.codigoBarras || '',
      costo: p.costo, precioVenta: p.precioVenta, stock: p.stock
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const payload = {
        ...form,
        costo: parseFloat(form.costo) || 0,
        precioVenta: parseFloat(form.precioVenta) || 0,
        stock: parseInt(form.stock, 10) || 0
      }
      if (editing) {
        await productos.update(editing._id, payload)
      } else {
        await productos.create(payload)
      }
      setShowModal(false)
      load()
    } catch (e) {
      setError(e.response?.data?.msg || 'Error al guardar')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este producto?')) return
    try {
      await productos.delete(id)
      load()
    } catch (e) {
      setError(e.response?.data?.msg || 'Error al eliminar')
    }
  }

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const { data } = await bulk.upload(file)
      alert(`Importado: ${data.created} creados, ${data.updated} actualizados`)
      load()
    } catch (e) {
      setError(e.response?.data?.msg || 'Error al importar')
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <div className="flex mb-2" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <h1 className="page-title">Productos</h1>
        {isAdmin && (
          <div className="flex">
            <input id="csv-upload" type="file" accept=".csv" onChange={handleUpload} disabled={uploading} style={{ display: 'none' }} />
            <button type="button" className="secondary" onClick={() => document.getElementById('csv-upload')?.click()} disabled={uploading}>
              {uploading ? 'Subiendo...' : 'Importar CSV'}
            </button>
            <button onClick={openCreate}>Nuevo producto</button>
          </div>
        )}
      </div>

      {error && <div className="alert error">{error}</div>}

      {loading ? (
        <p className="text-muted">Cargando...</p>
      ) : (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Stock</th>
                <th>Costo</th>
                <th>Precio venta</th>
                {isAdmin && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p._id}>
                  <td>{p.codigoInterno || '-'}</td>
                  <td>{p.nombre}</td>
                  <td>{p.categoria}</td>
                  <td className={p.stock <= 0 ? 'text-danger' : ''}>{p.stock}</td>
                  <td>${p.costo?.toLocaleString()}</td>
                  <td>${p.precioVenta?.toLocaleString()}</td>
                  {isAdmin && (
                    <td>
                      <button className="secondary" style={{ padding: '6px 12px', marginRight: 8 }} onClick={() => openEdit(p)}>Editar</button>
                      <button className="danger" style={{ padding: '6px 12px' }} onClick={() => handleDelete(p._id)}>Eliminar</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && <p className="text-muted" style={{ padding: 20 }}>No hay productos</p>}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editing ? 'Editar producto' : 'Nuevo producto'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Nombre *</label>
                  <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Categoría *</label>
                  <input value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Código de barras</label>
                  <input value={form.codigoBarras} onChange={(e) => setForm({ ...form, codigoBarras: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Costo *</label>
                  <input type="number" step="0.01" value={form.costo} onChange={(e) => setForm({ ...form, costo: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Precio venta *</label>
                  <input type="number" step="0.01" value={form.precioVenta} onChange={(e) => setForm({ ...form, precioVenta: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Stock</label>
                  <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
                </div>
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
