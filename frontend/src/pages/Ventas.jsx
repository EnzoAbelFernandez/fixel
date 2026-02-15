import { useState, useEffect } from 'react'
import { productos, combos, ventas, usuarios } from '../api/client'
import { useAuth } from '../context/AuthContext'

const MEDIOS_PAGO = ['Efectivo', 'Tarjeta', 'Transferencia', 'Otro']

export default function Ventas() {
  const [productosList, setProductosList] = useState([])
  const [combosList, setCombosList] = useState([])
  const [usuariosList, setUsuariosList] = useState([])
  const [carrito, setCarrito] = useState([])
  const [carritoCombos, setCarritoCombos] = useState([])
  const [vendedorId, setVendedorId] = useState('')
  const [descuento, setDescuento] = useState(0)
  const [medioPago, setMedioPago] = useState('Efectivo')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { user, isAdmin } = useAuth()

  useEffect(() => {
    productos.list().then(({ data }) => setProductosList(data))
    combos.list().then(({ data }) => setCombosList(data))
    if (isAdmin) usuarios.list().then(({ data }) => setUsuariosList(data))
    else setVendedorId(user?.id)
  }, [isAdmin, user?.id])

  const addToCarrito = (prod, cant = 1) => {
    if (cant <= 0) return
    const existente = carrito.find((c) => c.productoId === prod._id)
    if (existente) {
      setCarrito(carrito.map((c) =>
        c.productoId === prod._id ? { ...c, cantidad: c.cantidad + cant } : c
      ))
    } else {
      setCarrito([...carrito, { productoId: prod._id, producto: prod, cantidad: cant }])
    }
  }

  const addComboToCarrito = (combo, cant = 1) => {
    if (cant <= 0) return
    const existente = carritoCombos.find((c) => c.comboId === combo._id)
    if (existente) {
      setCarritoCombos(carritoCombos.map((c) =>
        c.comboId === combo._id ? { ...c, cantidad: c.cantidad + cant } : c
      ))
    } else {
      setCarritoCombos([...carritoCombos, { comboId: combo._id, combo, cantidad: cant }])
    }
  }

  const removeFromCarrito = (productoId) => setCarrito(carrito.filter((c) => c.productoId !== productoId))
  const removeComboFromCarrito = (comboId) => setCarritoCombos(carritoCombos.filter((c) => c.comboId !== comboId))

  const updateCantidad = (productoId, cantidad) => {
    if (cantidad <= 0) removeFromCarrito(productoId)
    else setCarrito(carrito.map((c) => c.productoId === productoId ? { ...c, cantidad } : c))
  }

  const updateComboCantidad = (comboId, cantidad) => {
    if (cantidad <= 0) removeComboFromCarrito(comboId)
    else setCarritoCombos(carritoCombos.map((c) => c.comboId === comboId ? { ...c, cantidad } : c))
  }

  const subtotalProductos = carrito.reduce((acc, c) => acc + (c.producto?.precioVenta || 0) * c.cantidad, 0)
  const subtotalCombos = carritoCombos.reduce((acc, c) => acc + (c.combo?.precioVenta || 0) * c.cantidad, 0)
  const totalAntesDescuento = subtotalProductos + subtotalCombos
  const descuentoNum = Math.max(0, parseFloat(descuento) || 0)
  const totalVenta = Math.max(0, totalAntesDescuento - descuentoNum)

  const tieneStockCombo = (combo) => {
    if (!combo.items?.length) return false
    for (const it of combo.items) {
      const p = it.producto
      if (!p || (p.stock || 0) < it.cantidad) return false
    }
    return true
  }

  const handleVender = async () => {
    if ((carrito.length === 0 && carritoCombos.length === 0) || !vendedorId) {
      setError('Agregá productos/combos y seleccioná vendedor')
      return
    }
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      await ventas.create({
        vendedorId,
        productosVendidos: carrito.map((c) => ({ productoId: c.productoId, cantidad: c.cantidad })),
        combosVendidos: carritoCombos.map((c) => ({ comboId: c.comboId, cantidad: c.cantidad })),
        descuento: descuentoNum,
        medioPago
      })
      setSuccess('Venta registrada correctamente')
      setCarrito([])
      setCarritoCombos([])
      setDescuento(0)
    } catch (e) {
      setError(e.response?.data?.msg || 'Error al registrar venta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h1 className="page-title">Nueva venta</h1>
      {error && <div className="alert error">{error}</div>}
      {success && <div className="alert success">{success}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 24 }}>
        <div>
          <div className="card mb-2">
            <h3 className="mb-2">Productos</h3>
            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              {productosList.filter((p) => p.stock > 0).map((p) => (
                <div key={p._id} className="flex mb-1" style={{ justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <div><strong>{p.nombre}</strong> — ${p.precioVenta?.toLocaleString()} (stock: {p.stock})</div>
                  <div className="flex">
                    <input type="number" min="1" max={p.stock} defaultValue="1" style={{ width: 60 }} onBlur={(e) => { const v = parseInt(e.target.value, 10); if (v > 0) addToCarrito(p, v) }} />
                    <button className="secondary" style={{ padding: '6px 12px', marginLeft: 8 }} onClick={() => addToCarrito(p)}>+</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card mb-2">
            <h3 className="mb-2">Combos</h3>
            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              {combosList.map((c) => {
                const ok = tieneStockCombo(c)
                return (
                  <div key={c._id} className="flex mb-1" style={{ justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <strong>{c.nombre}</strong> — ${c.precioVenta?.toLocaleString()}
                      {!ok && <span className="text-danger" style={{ fontSize: '0.85rem', marginLeft: 8 }}>Sin stock</span>}
                    </div>
                    <button className="secondary" style={{ padding: '6px 12px' }} onClick={() => addComboToCarrito(c)} disabled={!ok}>+</button>
                  </div>
                )
              })}
              {combosList.length === 0 && <p className="text-muted">No hay combos creados</p>}
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="mb-2">Carrito</h3>
          {isAdmin && (
            <div className="form-group mb-2">
              <label>Vendedor</label>
              <select value={vendedorId} onChange={(e) => setVendedorId(e.target.value)}>
                <option value="">Seleccionar...</option>
                {usuariosList.map((u) => <option key={u._id} value={u._id}>{u.nombre}</option>)}
              </select>
            </div>
          )}
          {carrito.length === 0 && carritoCombos.length === 0 ? (
            <p className="text-muted">Carrito vacío. Agregá productos o combos.</p>
          ) : (
            <>
              <div style={{ maxHeight: 220, overflowY: 'auto', marginBottom: 16 }}>
                {carrito.map((c) => (
                  <div key={c.productoId} className="flex mb-1" style={{ justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                    <div>{c.producto?.nombre} x{c.cantidad}</div>
                    <div className="flex">
                      <input type="number" min="1" value={c.cantidad} onChange={(e) => updateCantidad(c.productoId, parseInt(e.target.value, 10) || 1)} style={{ width: 50 }} />
                      <span style={{ marginLeft: 8 }}>${((c.producto?.precioVenta || 0) * c.cantidad).toLocaleString()}</span>
                      <button className="danger" style={{ padding: '4px 8px', marginLeft: 6 }} onClick={() => removeFromCarrito(c.productoId)}>×</button>
                    </div>
                  </div>
                ))}
                {carritoCombos.map((c) => (
                  <div key={c.comboId} className="flex mb-1" style={{ justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                    <div>{c.combo?.nombre} x{c.cantidad}</div>
                    <div className="flex">
                      <input type="number" min="1" value={c.cantidad} onChange={(e) => updateComboCantidad(c.comboId, parseInt(e.target.value, 10) || 1)} style={{ width: 50 }} />
                      <span style={{ marginLeft: 8 }}>${((c.combo?.precioVenta || 0) * c.cantidad).toLocaleString()}</span>
                      <button className="danger" style={{ padding: '4px 8px', marginLeft: 6 }} onClick={() => removeComboFromCarrito(c.comboId)}>×</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="form-group">
                <label>Descuento ($)</label>
                <input type="number" min="0" step="0.01" value={descuento} onChange={(e) => setDescuento(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Medio de pago</label>
                <select value={medioPago} onChange={(e) => setMedioPago(e.target.value)}>
                  {MEDIOS_PAGO.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                {descuentoNum > 0 && (
                  <div className="flex mb-1" style={{ justifyContent: 'space-between' }}>
                    <span>Subtotal</span>
                    <span>${totalAntesDescuento.toLocaleString()}</span>
                  </div>
                )}
                {descuentoNum > 0 && (
                  <div className="flex mb-1" style={{ justifyContent: 'space-between', color: 'var(--success)' }}>
                    <span>Descuento</span>
                    <span>-${descuentoNum.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex" style={{ justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 700 }}>
                  <span>Total</span>
                  <span>${totalVenta.toLocaleString()}</span>
                </div>
                <button className="mt-2" style={{ width: '100%' }} onClick={handleVender} disabled={loading}>
                  {loading ? 'Procesando...' : 'Registrar venta'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
