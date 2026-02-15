import { useState, useEffect } from 'react'
import { garantias, productos } from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function Garantias() {
  const [lista, setLista] = useState([])
  const [productosList, setProductosList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ productoId: '', cantidad: 1, motivo: '' })
  const [filtroStart, setFiltroStart] = useState('')
  const [filtroEnd, setFiltroEnd] = useState('')
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
    }
  }

  return (
    <>
      <div className="flex mb-2" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <h1 className="page-title">Garantías / Pérdidas</h1>
        <button onClick={() => setShowForm(true)}>Registrar pérdida</button>
      </div>

      {error && <div className="alert error">{error}</div>}

      {showForm && (
        <div className="card mb-2">
          <h3 className="mb-2">Nueva pérdida o garantía</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
                <label>Producto</label>
                <select value={form.productoId} onChange={(e) => setForm({ ...form, productoId: e.target.value })} required>
                  <option value="">Seleccionar...</option>
                  {productosList.map((p) => (
                    <option key={p._id} value={p._id}>{p.nombre} (stock: {p.stock})</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ width: 120 }}>
                <label>Cantidad</label>
                <input type="number" min="1" value={form.cantidad} onChange={(e) => setForm({ ...form, cantidad: e.target.value })} required />
              </div>
              <div className="form-group" style={{ flex: 2, minWidth: 200 }}>
                <label>Motivo</label>
                <input value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} placeholder="Ej: Falla de fábrica" required />
              </div>
              <div className="form-group" style={{ alignSelf: 'flex-end' }}>
                <button type="button" className="secondary" onClick={() => setShowForm(false)}>Cancelar</button>
                <button type="submit" style={{ marginLeft: 8 }}>Registrar</button>
              </div>
            </div>
          </form>
        </div>
      )}

      {isAdmin && (
        <div className="flex mb-2" style={{ gap: 12 }}>
          <input type="date" value={filtroStart} onChange={(e) => setFiltroStart(e.target.value)} />
          <input type="date" value={filtroEnd} onChange={(e) => setFiltroEnd(e.target.value)} />
        </div>
      )}

      {loading ? (
        <p className="text-muted">Cargando...</p>
      ) : (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Motivo</th>
                <th>Costo perdido</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((g) => (
                <tr key={g._id}>
                  <td>{new Date(g.fecha).toLocaleDateString()}</td>
                  <td>{g.producto?.nombre || '-'}</td>
                  <td>{g.cantidad}</td>
                  <td>{g.motivo}</td>
                  <td className="text-danger">${g.costoPerdido?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {lista.length === 0 && <p className="text-muted" style={{ padding: 20 }}>No hay registros</p>}
        </div>
      )}
    </>
  )
}
