import { useState, useEffect } from 'react'
import { reportes } from '../api/client'

export default function Reportes() {
  const todayStr = new Date().toISOString().slice(0, 10)
  const [mode, setMode] = useState('day') // 'day' o 'range'
  const [day, setDay] = useState(todayStr)
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')

  // Calcular primer día del mes actual (YYYY-MM-01)
  const firstOfMonth = todayStr.slice(0, 8) + '01'
  const [ventasData, setVentasData] = useState(null)
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
      const [v, p, b] = await Promise.all([
        reportes.ventas(params),
        reportes.perdidas(params),
        reportes.balance(params)
      ])
      setVentasData(v.data)
      setPerdidasData(p.data)
      setBalanceData(b.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [mode, day, start, end])

  const changeDay = (delta) => {
    const d = new Date(day)
    d.setDate(d.getDate() + delta)
    setDay(d.toISOString().slice(0, 10))
  }

  // Cambiar a modo rango y setear fechas por defecto
  const handleSetRangeMode = () => {
    setStart(firstOfMonth)
    setEnd(todayStr)
    setMode('range')
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
      )}
    </>
  )
}
