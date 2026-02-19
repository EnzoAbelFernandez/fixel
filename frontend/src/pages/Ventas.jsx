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

  const formatPrecio = (n) => (n != null ? `$${Number(n).toLocaleString('es-CL')}` : '-')
  const productosFiltrados = productosList.filter((p) => {
    const coincideBusqueda = !busqueda.trim() || p.nombre.toLowerCase().includes(busqueda.trim().toLowerCase())
    const coincideCategoria = categoriaSeleccionada === 'todos' || (typeof p.categoria === 'object' ? p.categoria?._id === categoriaSeleccionada : p.categoria === categoriaSeleccionada)
    return p.stock > 0 && coincideCategoria && coincideBusqueda
  })

  return (
    <>
      <h1 className="page-title">Nueva venta</h1>
      {error && <div className="alert error">{error}</div>}
      {success && <div className="alert success">{success}</div>}

      <div className="ventas-layout">
        <aside className="ventas-categorias-card">
          <h3 className="ventas-panel-title">Categorías</h3>
          <select
            className="ventas-cat-select"
            value={categoriaSeleccionada}
            onChange={(e) => setCategoriaSeleccionada(e.target.value)}
            aria-label="Filtrar por categoría"
          >
            <option value="todos">Todos los productos</option>
            {categoriasList.map((cat) => (
              <option key={cat._id} value={cat._id}>{cat.nombre}</option>
            ))}
          </select>
          <div className="ventas-categorias-list">
            <button
              type="button"
              className={`ventas-cat-item ${categoriaSeleccionada === 'todos' ? 'ventas-cat-item--active' : ''}`}
              onClick={() => setCategoriaSeleccionada('todos')}
            >
              Todos los productos
            </button>
            {categoriasList.map((cat) => (
              <button
                key={cat._id}
                type="button"
                className={`ventas-cat-item ${categoriaSeleccionada === cat._id ? 'ventas-cat-item--active' : ''}`}
                onClick={() => setCategoriaSeleccionada(cat._id)}
              >
                {cat.nombre}
              </button>
            ))}
          </div>
        </aside>

        <div className="ventas-centro">
          <div className="ventas-productos-card">
            <div className="ventas-panel-header">
              <h3 className="ventas-panel-title">Productos</h3>
              <div className="productos-search-wrap ventas-search-wrap">
                <span className="productos-search-icon" aria-hidden>⌕</span>
                <input
                  type="search"
                  className="productos-search"
                  placeholder="Buscar producto..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  aria-label="Buscar producto"
                />
              </div>
            </div>
            <div className="ventas-grid">
              {productosFiltrados.map((p) => (
                <button
                  key={p._id}
                  type="button"
                  className="ventas-tile"
                  onClick={() => addToCarrito(p, 1)}
                  title="Agregar al carrito"
                >
                  <span className="ventas-tile-nombre">{p.nombre}</span>
                  <span className="ventas-tile-precio">{formatPrecio(p.precioVenta)}</span>
                </button>
              ))}
              {productosFiltrados.length === 0 && (
                <p className="ventas-grid-empty">No hay productos en esta categoría</p>
              )}
            </div>
          </div>

          <div className="ventas-combos-card">
            <h3 className="ventas-panel-title">Combos</h3>
            <div className="ventas-grid">
              {combosList.map((c) => {
                const ok = tieneStockCombo(c)
                return (
                  <button
                    key={c._id}
                    type="button"
                    className={`ventas-tile ${!ok ? 'ventas-tile--disabled' : ''}`}
                    onClick={() => ok && addComboToCarrito(c, 1)}
                    title={ok ? 'Agregar al carrito' : 'Sin stock'}
                    disabled={!ok}
                  >
                    <span className="ventas-tile-nombre">{c.nombre}</span>
                    <span className="ventas-tile-precio">{formatPrecio(c.precioVenta)}</span>
                    {!ok && <span className="ventas-tile-badge">Sin stock</span>}
                  </button>
                )
              })}
              {combosList.length === 0 && <p className="ventas-grid-empty">No hay combos creados</p>}
            </div>
          </div>
        </div>

        <div className="ventas-carrito-card">
          <h3 className="ventas-panel-title">Carrito</h3>
          {isAdmin && (
            <div className="ventas-carrito-vendedor">
              <label htmlFor="ventas-vendedor">Vendedor</label>
              <select id="ventas-vendedor" value={vendedorId} onChange={(e) => setVendedorId(e.target.value)}>
                <option value="">Seleccionar...</option>
                {usuariosList.map((u) => (
                  <option key={u._id} value={u._id}>{u.nombre}</option>
                ))}
              </select>
            </div>
          )}
          {carrito.length === 0 && carritoCombos.length === 0 ? (
            <p className="ventas-carrito-vacio">Carrito vacío. Agregá productos o combos.</p>
          ) : (
            <>
              <div className="ventas-carrito-items">
                {carrito.map((c) => (
                  <div key={c.productoId} className="ventas-carrito-item">
                    <span className="ventas-carrito-item-nombre">{c.producto?.nombre}</span>
                    <div className="ventas-carrito-item-controls">
                      <button type="button" className="ventas-carrito-btn" onClick={() => updateCantidad(c.productoId, c.cantidad - 1)} aria-label="Menos">−</button>
                      <span className="ventas-carrito-cant">{c.cantidad}</span>
                      <button type="button" className="ventas-carrito-btn" onClick={() => updateCantidad(c.productoId, c.cantidad + 1)} aria-label="Más">+</button>
                      <span className="ventas-carrito-item-precio">{formatPrecio((c.producto?.precioVenta || 0) * c.cantidad)}</span>
                      <button type="button" className="ventas-carrito-btn ventas-carrito-btn-remove" onClick={() => removeFromCarrito(c.productoId)} aria-label="Quitar">×</button>
                    </div>
                  </div>
                ))}
                {carritoCombos.map((c) => (
                  <div key={c.comboId} className="ventas-carrito-item">
                    <span className="ventas-carrito-item-nombre">{c.combo?.nombre} ×{c.cantidad}</span>
                    <div className="ventas-carrito-item-controls">
                      <input
                        type="number"
                        min="1"
                        value={c.cantidad}
                        onChange={(e) => updateComboCantidad(c.comboId, parseInt(e.target.value, 10) || 1)}
                        className="ventas-carrito-input-cant"
                        aria-label="Cantidad"
                      />
                      <span className="ventas-carrito-item-precio">{formatPrecio((c.combo?.precioVenta || 0) * c.cantidad)}</span>
                      <button type="button" className="ventas-carrito-btn ventas-carrito-btn-remove" onClick={() => removeComboFromCarrito(c.comboId)} aria-label="Quitar">×</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="ventas-carrito-form">
                <div className="form-group">
                  <label htmlFor="ventas-descuento">Descuento ($)</label>
                  <input id="ventas-descuento" type="number" min="0" step="0.01" value={descuento} onChange={(e) => setDescuento(e.target.value)} />
                </div>
                <div className="form-group">
                  <label htmlFor="ventas-medio">Medio de pago</label>
                  <select id="ventas-medio" value={medioPago} onChange={(e) => setMedioPago(e.target.value)}>
                    {MEDIOS_PAGO.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              <div className="ventas-carrito-totales">
                {descuentoNum > 0 && (
                  <>
                    <div className="ventas-carrito-fila">
                      <span>Subtotal</span>
                      <span>{formatPrecio(totalAntesDescuento)}</span>
                    </div>
                    <div className="ventas-carrito-fila ventas-carrito-descuento">
                      <span>Descuento</span>
                      <span>−{formatPrecio(descuentoNum)}</span>
                    </div>
                  </>
                )}
                <div className="ventas-carrito-total">
                  <span>Total</span>
                  <span>{formatPrecio(totalVenta)}</span>
                </div>
                <button type="button" className="ventas-btn-vender" onClick={handleVender} disabled={loading}>
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
