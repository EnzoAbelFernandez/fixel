import { useState, useEffect, useRef } from 'react'
import { garantias, productos } from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function Garantias() {
  const [lista, setLista] = useState([])
  const [productosList, setProductosList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ productoId: '', cantidad: 1, motivo: '' })
  const [submitting, setSubmitting] = useState(false)
  const [filtroStart, setFiltroStart] = useState('')
  const [filtroEnd, setFiltroEnd] = useState('')
  const [search, setSearch] = useState('')
  const overlayClickStarted = useRef(false)
  const { isAdmin } = useAuth()

  const load = async () => {
    try {
      const params = {}
      if (filtroStart) params.start = filtroStart
      if (filtroEnd) params.end = filtroEnd
      const { data } = await garantias.list(params)
      setLista(data)
    } catch (e) {
      setError(e.response?.data?.msg || 'Error al cargar')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [filtroStart, filtroEnd])

  useEffect(() => {
    productos.list().then(({ data }) => setProductosList(data))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await garantias.create({
        productoId: form.productoId,
        cantidad: form.cantidad,
        motivo: form.motivo,
        vendedorId: null
      })
      setShowForm(false)
      setForm({ productoId: '', cantidad: 1, motivo: '' })
      load()
    } catch (e) {
      setError(e.response?.data?.msg || 'Error al registrar')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredLista = lista.filter((g) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    const nombre = (g.producto?.nombre || '').toLowerCase()
    const motivo = (g.motivo || '').toLowerCase()
    return nombre.includes(q) || motivo.includes(q)
  })
  const formatPrecio = (n) => (n != null ? `$${Number(n).toLocaleString('es-CL')}` : '-')

  return (
    <>
      <div className="productos-header">
        <h1 className="page-title">Garantías / Pérdidas</h1>
        <div className="productos-actions">
          <button type="button" onClick={() => setShowForm(true)}>Registrar pérdida</button>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      {showForm && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => { if (e.target === e.currentTarget) overlayClickStarted.current = true }}
          onClick={(e) => {
            if (e.target === e.currentTarget && overlayClickStarted.current && !submitting) setShowForm(false)
            overlayClickStarted.current = false
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-garantia-title"
        >
          <div
            className="modal modal-producto"
            onMouseDown={() => { overlayClickStarted.current = false }}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 480 }}
          >
            <div className="modal-header">
              <h3 id="modal-garantia-title">Nueva pérdida o garantía</h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => !submitting && setShowForm(false)}
                aria-label="Cerrar"
                disabled={submitting}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label htmlFor="garantia-producto">Producto *</label>
                <select
                  id="garantia-producto"
                  value={form.productoId}
                  onChange={(e) => setForm({ ...form, productoId: e.target.value })}
                  required
                >
                  <option value="">Seleccionar producto...</option>
                  {productosList.map((p) => (
                    <option key={p._id} value={p._id}>{p.nombre} (stock: {p.stock})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="garantia-cantidad">Cantidad *</label>
                <input
                  id="garantia-cantidad"
                  type="number"
                  min="1"
                  value={form.cantidad}
                  onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="garantia-motivo">Motivo *</label>
                <input
                  id="garantia-motivo"
                  value={form.motivo}
                  onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                  placeholder="Ej: Falla de fábrica"
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="secondary" onClick={() => !submitting && setShowForm(false)} disabled={submitting}>
                  Cancelar
                </button>
                <button type="submit" disabled={submitting}>
                  {submitting ? 'Registrando...' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="productos-toolbar">
        <div className="productos-search-wrap">
          <span className="productos-search-icon" aria-hidden>⌕</span>
          <input
            type="search"
            className="productos-search"
            placeholder="Buscar por producto o motivo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Buscar registros"
          />
        </div>
        {isAdmin && (
          <>
            <label className="garantias-filtro-label" htmlFor="garantias-start">
              Desde
            </label>
            <input
              id="garantias-start"
              type="date"
              className="garantias-filtro-date"
              value={filtroStart}
              onChange={(e) => setFiltroStart(e.target.value)}
              aria-label="Fecha desde"
            />
            <label className="garantias-filtro-label" htmlFor="garantias-end">
              Hasta
            </label>
            <input
              id="garantias-end"
              type="date"
              className="garantias-filtro-date"
              value={filtroEnd}
              onChange={(e) => setFiltroEnd(e.target.value)}
              aria-label="Fecha hasta"
            />
          </>
        )}
        <span className="productos-count">
          {filteredLista.length === lista.length
            ? `${lista.length} registro${lista.length !== 1 ? 's' : ''}`
            : `${filteredLista.length} de ${lista.length}`}
        </span>
      </div>

      {loading ? (
        <div className="productos-loading">
          <span className="productos-loading-text">Cargando registros...</span>
        </div>
      ) : (
        <div className="productos-card">
          <div className="productos-table-wrap">
            <table className="productos-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Producto</th>
                  <th className="productos-th-num">Cantidad</th>
                  <th>Motivo</th>
                  <th className="productos-th-num">Costo perdido</th>
                </tr>
              </thead>
              <tbody>
                {filteredLista.map((g) => (
                  <tr key={g._id}>
                    <td className="productos-cell-code">{new Date(g.fecha).toLocaleDateString('es-CL')}</td>
                    <td className="productos-cell-name">{g.producto?.nombre || '—'}</td>
                    <td className="productos-cell-num">{g.cantidad}</td>
                    <td>{g.motivo}</td>
                    <td className="productos-cell-num productos-cell-costo-perdido">{formatPrecio(g.costoPerdido)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredLista.length === 0 && (
            <div className="productos-empty">
              {lista.length === 0
                ? 'No hay registros de garantías o pérdidas.'
                : 'Ningún registro coincide con la búsqueda.'}
            </div>
          )}
        </div>
      )}
    </>
  )
}
