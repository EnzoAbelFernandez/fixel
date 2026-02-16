import { useState, useEffect } from 'react'
import { productos, combos, ventas, usuarios, categorias } from '../api/client'
import { useAuth } from '../context/AuthContext'


const MEDIOS_PAGO = ['Efectivo', 'Tarjeta', 'Transferencia', 'Otro']

export default function Ventas() {
  const [busqueda, setBusqueda] = useState('')
  const [productosList, setProductosList] = useState([])
  const [categoriasList, setCategoriasList] = useState([])
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('todos')
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
    categorias.list().then(({ data }) => setCategoriasList(data))
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

      <div style={{
        display: 'grid',
        gridTemplateColumns: '260px 1fr 400px',
        gap: 24,
        height: 'calc(100vh - 110px)', // Ajusta según header/navbar
        minHeight: 500
      }}>
        {/* Columna de categorías */}
        <div className="card mb-2" style={{ padding: 0, minHeight: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <h3 className="mb-2" style={{ padding: '16px 16px 0 16px' }}>Categorías</h3>
          <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
            <div
              className={categoriaSeleccionada === 'todos' ? 'selected' : ''}
              style={{ padding: 8, cursor: 'pointer', borderRadius: 4, background: categoriaSeleccionada === 'todos' ? 'var(--primary-light)' : 'none', fontWeight: categoriaSeleccionada === 'todos' ? 600 : 400, marginBottom: 4 }}
              onClick={() => setCategoriaSeleccionada('todos')}
            >
              Todos los productos
            </div>
            {categoriasList.map(cat => (
              <div
                key={cat._id}
                className={categoriaSeleccionada === cat._id ? 'selected' : ''}
                style={{ padding: 8, cursor: 'pointer', borderRadius: 4, background: categoriaSeleccionada === cat._id ? 'var(--primary-light)' : 'none', fontWeight: categoriaSeleccionada === cat._id ? 600 : 400, marginBottom: 4 }}
                onClick={() => setCategoriaSeleccionada(cat._id)}
              >
                {cat.nombre}
              </div>
            ))}
          </div>
        </div>

        {/* Listado de productos filtrado */}
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div className="card mb-2" style={{ flex: '7 1 0%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <h3 className="mb-2" style={{ marginBottom: 0 }}>Productos</h3>
              <input
                type="text"
                placeholder="Buscar producto..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                style={{ flex: 1, minWidth: 0, padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--background)', color: '#fff' }}
              />
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: 14,
              flex: 1,
              overflowY: 'auto',
              padding: 4,
              background: 'var(--background)',
              alignContent: 'flex-start'
            }}>
              {productosList.filter((p) => {
                const coincideBusqueda = busqueda.trim() === '' || p.nombre.toLowerCase().includes(busqueda.trim().toLowerCase());
                const coincideCategoria = categoriaSeleccionada === 'todos' || (typeof p.categoria === 'object' ? p.categoria?._id === categoriaSeleccionada : p.categoria === categoriaSeleccionada);
                return p.stock > 0 && coincideCategoria && coincideBusqueda;
              }).map((p) => (
                <div
                  key={p._id}
                  onClick={() => addToCarrito(p, 1)}
                  style={{
                    cursor: 'pointer',
                    border: '2px solid #334155',
                    borderRadius: 10,
                    padding: '18px 8px 14px 8px',
                    background: 'var(--background, #23293a)',
                    boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)',
                    textAlign: 'center',
                    userSelect: 'none',
                    transition: 'box-shadow 0.15s, border 0.15s',
                    color: '#fff',
                    fontFamily: 'inherit',
                    fontSize: 15,
                    fontWeight: 500,
                  }}
                  className="product-tile"
                  title="Agregar al carrito"
                  onMouseOver={e => e.currentTarget.style.boxShadow = '0 4px 16px 0 rgba(0,0,0,0.10)'}
                  onMouseOut={e => e.currentTarget.style.boxShadow = '0 2px 8px 0 rgba(0,0,0,0.04)'}
                >
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{p.nombre}</div>
                  <div style={{ color: 'var(--primary-light)', fontWeight: 800, fontSize: 18 }}>${p.precioVenta?.toLocaleString()}</div>
                </div>
              ))}
              {productosList.filter((p) => p.stock > 0 && (categoriaSeleccionada === 'todos' || (typeof p.categoria === 'object' ? p.categoria?._id === categoriaSeleccionada : p.categoria === categoriaSeleccionada))).length === 0 && (
                <p className="text-muted" style={{ gridColumn: '1/-1' }}>No hay productos en esta categoría</p>
              )}
            </div>
          </div>

          <div className="card mb-2" style={{ flex: '3 1 0%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <h3 className="mb-2">Combos</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: 14,
              flex: 1,
              overflowY: 'auto',
              padding: 4,
              background: 'var(--background)',
              alignContent: 'flex-start'
            }}>
              {combosList.map((c) => {
                const ok = tieneStockCombo(c)
                return (
                  <div
                    key={c._id}
                    onClick={() => ok && addComboToCarrito(c, 1)}
                    style={{
                      cursor: ok ? 'pointer' : 'not-allowed',
                      border: '2px solid #334155',
                      borderRadius: 10,
                      padding: '18px 8px 14px 8px',
                      background: 'var(--background, #23293a)',
                      boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)',
                      textAlign: 'center',
                      userSelect: 'none',
                      transition: 'box-shadow 0.15s, border 0.15s',
                      color: '#fff',
                      fontFamily: 'inherit',
                      fontSize: 15,
                      fontWeight: 500,
                      opacity: ok ? 1 : 0.5
                    }}
                    className="product-tile"
                    title={ok ? 'Agregar al carrito' : 'Sin stock'}
                    onMouseOver={e => ok && (e.currentTarget.style.boxShadow = '0 4px 16px 0 rgba(0,0,0,0.10)')}
                    onMouseOut={e => ok && (e.currentTarget.style.boxShadow = '0 2px 8px 0 rgba(0,0,0,0.04)')}
                  >
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{c.nombre}</div>
                    <div style={{ color: 'var(--primary-light)', fontWeight: 800, fontSize: 18 }}>${c.precioVenta?.toLocaleString()}</div>
                    {!ok && <div className="text-danger" style={{ fontSize: '0.85rem', marginTop: 6 }}>Sin stock</div>}
                  </div>
                )
              })}
              {combosList.length === 0 && <p className="text-muted" style={{ gridColumn: '1/-1' }}>No hay combos creados</p>}
            </div>
          </div>
        </div>

        <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
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
              <div style={{ flex: 1, overflowY: 'auto', marginBottom: 16 }}>
                {carrito.map((c) => (
                  <div key={c.productoId} className="flex mb-1" style={{ justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                    <div>{c.producto?.nombre}</div>
                    <div className="flex" style={{ alignItems: 'center' }}>
                      <button className="secondary" style={{ padding: '2px 8px', fontSize: 18 }} onClick={() => updateCantidad(c.productoId, c.cantidad - 1)}>-</button>
                      <span style={{ margin: '0 10px', minWidth: 24, textAlign: 'center' }}>{c.cantidad}</span>
                      <button className="secondary" style={{ padding: '2px 8px', fontSize: 18 }} onClick={() => updateCantidad(c.productoId, c.cantidad + 1)}>+</button>
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
