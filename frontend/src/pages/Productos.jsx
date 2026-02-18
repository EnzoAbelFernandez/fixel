import { useState, useEffect, useRef } from 'react'
import { productos, bulk, categorias } from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function Productos() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [cats, setCats] = useState([])
  const [catLoading, setCatLoading] = useState(false)
  const [catError, setCatError] = useState('')
  const [showCatInput, setShowCatInput] = useState(false)
  const { isAdmin } = useAuth()

  const [form, setForm] = useState({
    nombre: '', categoria: '', codigoBarras: '', costo: '', precioVenta: '', stock: 0
  })
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const overlayClickStarted = useRef(false)

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

  const loadCats = async () => {
    setCatLoading(true)
    setCatError('')
    try {
      const { data } = await categorias.list()
      setCats(data)
    } catch (e) {
      setCatError(e.response?.data?.msg || 'Error al cargar categorías')
    } finally {
      setCatLoading(false)
    }
  }

  useEffect(() => { load(); loadCats(); }, [])

  const getCatName = (p) =>
    typeof p.categoria === 'object' && p.categoria?.nombre
      ? p.categoria.nombre
      : (cats.find((c) => c._id === p.categoria)?.nombre || '-')

  const filteredItems = items.filter((p) => {
    const matchSearch =
      !search ||
      [p.nombre, p.codigoBarras, p.codigoInterno].some(
        (v) => v && String(v).toLowerCase().includes(search.toLowerCase())
      )
    const matchCat = !filterCat || (typeof p.categoria === 'object' ? p.categoria?._id : p.categoria) === filterCat
    return matchSearch && matchCat
  })

  const openCreate = () => {
    setEditing(null)
    setForm({ nombre: '', categoria: '', codigoBarras: '', costo: '', precioVenta: '', stock: 0 })
    setShowCatInput(false)
    setShowModal(true)
  }

  const openEdit = (p) => {
    setEditing(p)
    setForm({
      nombre: p.nombre,
      categoria: typeof p.categoria === 'object' && p.categoria?._id ? p.categoria._id : p.categoria,
      codigoBarras: p.codigoBarras || '',
      costo: p.costo, precioVenta: p.precioVenta, stock: p.stock
    })
    setShowCatInput(false)
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      let catId = form.categoria
      if (showCatInput && form.categoria && !cats.some(c => c.nombre === form.categoria)) {
        const { data } = await categorias.create({ nombre: form.categoria })
        catId = data._id
        await loadCats()
      }
      const payload = {
        ...form,
        categoria: catId,
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
    } finally {
      setSubmitting(false)
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

  const formatPrecio = (n) => (n != null ? `$${Number(n).toLocaleString('es-CL')}` : '-')

  return (
    <>
      <div className="productos-header">
        <h1 className="page-title">Productos</h1>
        <div className="productos-actions">
          {isAdmin && (
            <>
              <input id="csv-upload" type="file" accept=".csv" onChange={handleUpload} disabled={uploading} style={{ display: 'none' }} />
              <button type="button" className="secondary" onClick={() => document.getElementById('csv-upload')?.click()} disabled={uploading}>
                {uploading ? 'Subiendo...' : 'Importar CSV'}
              </button>
            </>
          )}
          <button type="button" onClick={openCreate}>Nuevo producto</button>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      {loading ? (
        <div className="productos-loading">
          <span className="productos-loading-text">Cargando productos...</span>
        </div>
      ) : (
        <>
          <div className="productos-toolbar">
            <div className="productos-search-wrap">
              <span className="productos-search-icon" aria-hidden>⌕</span>
              <input
                type="search"
                className="productos-search"
                placeholder="Buscar por nombre o código..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Buscar productos"
              />
            </div>
            <select
              className="productos-filter-cat"
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              aria-label="Filtrar por categoría"
            >
              <option value="">Todas las categorías</option>
              {cats.map((c) => (
                <option key={c._id} value={c._id}>{c.nombre}</option>
              ))}
            </select>
            <span className="productos-count">
              {filteredItems.length === items.length
                ? `${items.length} producto${items.length !== 1 ? 's' : ''}`
                : `${filteredItems.length} de ${items.length}`}
            </span>
          </div>

          <div className="productos-card">
            <div className="productos-table-wrap">
              <table className="productos-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>Categoría</th>
                    <th className="productos-th-num">Stock</th>
                    <th className="productos-th-num">Costo</th>
                    <th className="productos-th-num">Precio venta</th>
                    <th className="productos-th-actions">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((p) => (
                    <tr key={p._id}>
                      <td className="productos-cell-code">{p.codigoBarras || p.codigoInterno || '—'}</td>
                      <td className="productos-cell-name">{p.nombre}</td>
                      <td><span className="productos-cat">{getCatName(p)}</span></td>
                      <td className="productos-cell-num">
                        <span className={`productos-stock ${p.stock <= 0 ? 'stock-cero' : p.stock <= 5 ? 'stock-bajo' : ''}`}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="productos-cell-num">{formatPrecio(p.costo)}</td>
                      <td className="productos-cell-num productos-cell-precio">{formatPrecio(p.precioVenta)}</td>
                      <td className="productos-cell-actions">
                        <button type="button" className="productos-btn productos-btn-edit" onClick={() => openEdit(p)} title="Editar">
                          Editar
                        </button>
                        {isAdmin && (
                          <button type="button" className="productos-btn productos-btn-delete" onClick={() => handleDelete(p._id)} title="Eliminar">
                            Eliminar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredItems.length === 0 && (
              <div className="productos-empty">
                {items.length === 0
                  ? 'No hay productos. Crea uno o importa un CSV.'
                  : 'Ningún producto coincide con el filtro.'}
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
          aria-labelledby="modal-producto-title"
        >
          <div className="modal modal-producto" onMouseDown={() => { overlayClickStarted.current = false }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 id="modal-producto-title">{editing ? 'Editar producto' : 'Nuevo producto'}</h3>
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
              <section className="modal-section">
                <h4 className="modal-section-title">Datos del producto</h4>
                <div className="form-grid form-grid-producto">
                  <div className="form-group form-group-full">
                    <label htmlFor="producto-nombre">Nombre *</label>
                    <input
                      id="producto-nombre"
                      value={form.nombre}
                      onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                      placeholder="Ej. Cable USB tipo C"
                      required
                    />
                  </div>
                  <div className="form-group form-group-full">
                    <label>Categoría *</label>
                    {!showCatInput ? (
                      <div className="form-row-inline">
                        <select
                          value={form.categoria}
                          onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                          required
                          aria-label="Categoría"
                        >
                          <option value="">Seleccionar categoría...</option>
                          {cats.map((c) => (
                            <option key={c._id} value={c._id}>{c.nombre}</option>
                          ))}
                        </select>
                        <button type="button" className="secondary" onClick={() => { setShowCatInput(true); setForm((f) => ({ ...f, categoria: '' })) }}>
                          + Nueva categoría
                        </button>
                      </div>
                    ) : (
                      <div className="form-row-inline">
                        <input
                          value={form.categoria}
                          onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                          required
                          placeholder="Nombre de la nueva categoría"
                          autoFocus
                        />
                        <button type="button" className="secondary" onClick={() => setShowCatInput(false)}>
                          Cancelar
                        </button>
                      </div>
                    )}
                    {catLoading && <span className="form-hint text-muted">Cargando categorías...</span>}
                    {catError && <span className="form-hint text-danger">{catError}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="producto-codigo">Código de barras</label>
                    <input
                      id="producto-codigo"
                      value={form.codigoBarras}
                      onChange={(e) => setForm({ ...form, codigoBarras: e.target.value })}
                      placeholder="Opcional"
                    />
                  </div>
                </div>
              </section>
              <section className="modal-section">
                <h4 className="modal-section-title">Precios y stock</h4>
                <div className="form-grid form-grid-producto">
                  <div className="form-group">
                    <label htmlFor="producto-costo">Costo *</label>
                    <input
                      id="producto-costo"
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.costo}
                      onChange={(e) => setForm({ ...form, costo: e.target.value })}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="producto-precio">Precio venta *</label>
                    <input
                      id="producto-precio"
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
                    <label htmlFor="producto-stock">Stock inicial</label>
                    <input
                      id="producto-stock"
                      type="number"
                      min="0"
                      value={form.stock}
                      onChange={(e) => setForm({ ...form, stock: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>
              </section>
              <div className="modal-actions">
                <button type="button" className="secondary" onClick={() => !submitting && setShowModal(false)} disabled={submitting}>
                  Cancelar
                </button>
                <button type="submit" disabled={submitting}>
                  {submitting ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
