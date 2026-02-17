import { useState, useEffect } from 'react'
import { reportes, ventas } from '../api/client'

const formatLocalDate = (date = new Date()) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const parseLocalDate = (dateStr) => {
  const [year, month, day] = String(dateStr || '').split('-').map(Number)
  if (!year || !month || !day) return new Date()
  return new Date(year, month - 1, day)
}

export default function Reportes() {
  const todayStr = formatLocalDate()
  const [mode, setMode] = useState('day') // 'day' o 'range'
  const [day, setDay] = useState(todayStr)
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')

  // Calcular primer día del mes actual (YYYY-MM-01)
  const firstOfMonth = todayStr.slice(0, 8) + '01'
  const [ventasData, setVentasData] = useState(null)
  const [ventasItems, setVentasItems] = useState([])
  const [perdidasData, setPerdidasData] = useState(null)
  const [balanceData, setBalanceData] = useState(null)
  const [loading, setLoading] = useState(false)

  const params = {}
  if (mode === 'day') {
    params.start = day
    params.end = day
  } else {
    if (start) params.start = start
    if (end) params.end = end
  }

  const load = async () => {
    setLoading(true)
    try {
      const [v, p, b, l] = await Promise.all([
        reportes.ventas(params),
        reportes.perdidas(params),
        reportes.balance(params),
        ventas.list({ ...params, limit: 100 })
      ])
      setVentasData(v.data)
      setPerdidasData(p.data)
      setBalanceData(b.data)
      setVentasItems(Array.isArray(l.data) ? l.data : [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [mode, day, start, end])

  const changeDay = (delta) => {
    const d = parseLocalDate(day)
    d.setDate(d.getDate() + delta)
    setDay(formatLocalDate(d))
  }

  // Cambiar a modo rango y setear fechas por defecto
  const handleSetRangeMode = () => {
    setStart(firstOfMonth)
    setEnd(todayStr)
    setMode('range')
  }

  const downloadVenta = async (id, format = 'pdf') => {
    try {
      const response = await ventas.export(id, format)
      const blob = new Blob([response.data], { type: format === 'pdf' ? 'application/pdf' : 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `venta_${id}.${format}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
      alert('No se pudo exportar la venta')
    }
  }

  return (
    <>
      <h1 className="page-title">Reportes</h1>
      <div className="flex mb-2" style={{ gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        {mode === 'day' ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button type="button" onClick={() => changeDay(-1)}>&lt;</button>
            <input type="date" value={day} onChange={e => setDay(e.target.value)} style={{ minWidth: 120 }} />
            <button type="button" onClick={() => changeDay(1)}>&gt;</button>
            <button style={{width: '100%'}} type="button" className="secondary" onClick={handleSetRangeMode}>Ver periodo</button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="date" value={start} onChange={e => setStart(e.target.value)} placeholder="Desde" style={{ minWidth: 120 }} />
            <input type="date" value={end} onChange={e => setEnd(e.target.value)} placeholder="Hasta" style={{ minWidth: 120 }} />
            <button style={{width: '100%'}} type="button" className="secondary" onClick={() => setMode('day')}>Ver día</button>
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-muted">Cargando...</p>
      ) : (
        <>
          <div className="grid-2">
            <div className="stat-card">
              <div className="value">{ventasData?.cantidadVentas ?? 0}</div>
              <div className="label">Cantidad de ventas</div>
            </div>
            <div className="stat-card">
              <div className="value text-success">${ventasData?.totalIngresos?.toLocaleString() ?? 0}</div>
              <div className="label">Total ingresos (ventas)</div>
            </div>
            <div className="stat-card">
              <div className="value">${ventasData?.totalCosto?.toLocaleString() ?? 0}</div>
              <div className="label">Total costos</div>
            </div>
            <div className="stat-card">
              <div className="value">{ventasData?.cantidadVendida ?? 0}</div>
              <div className="label">Productos vendidos</div>
            </div>
            <div className="stat-card">
              <div className="value text-success">${ventasData?.gananciaNeta?.toLocaleString() ?? 0}</div>
              <div className="label">Ganancia neta (ventas)</div>
            </div>
            <div className="stat-card">
              <div className="value text-danger">${perdidasData?.totalPerdido?.toLocaleString() ?? 0}</div>
              <div className="label">Total perdido</div>
            </div>
            <div className="stat-card" style={{ gridColumn: '1 / -1' }}>
              <div className="value">${(balanceData?.gananciaNeta ?? 0).toLocaleString()}</div>
              <div className="label">Balance final (ganancia - pérdidas)</div>
            </div>
          </div>

          <div className="card mt-2" style={{ overflowX: 'auto' }}>
            <h3 className="mb-2">Listado de ventas</h3>
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Vendedor</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Pago</th>
                  <th>Factura</th>
                </tr>
              </thead>
              <tbody>
                {ventasItems.map((v) => {
                  const items = (v.productos || []).reduce((acc, p) => acc + (p.cantidad || 0), 0)
                  const combos = (v.combos || []).reduce((acc, c) => acc + (c.cantidad || 0), 0)
                  return (
                    <tr key={v._id}>
                      <td>{new Date(v.fecha).toLocaleString()}</td>
                      <td>{v.vendedor?.nombre || '-'}</td>
                      <td>{items + combos}</td>
                      <td>${(v.totalVenta || 0).toLocaleString()}</td>
                      <td>{v.medioPago || '-'}</td>
                      <td>
                        <button className="secondary" style={{ padding: '6px 12px' }} onClick={() => downloadVenta(v._id, 'pdf')}>
                          PDF
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {ventasItems.length === 0 && <p className="text-muted" style={{ padding: 20 }}>No hay ventas en el rango seleccionado</p>}
          </div>
        </>
      )}
    </>
  )
}
