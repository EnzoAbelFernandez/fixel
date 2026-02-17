const Venta = require('../models/Venta');
const Producto = require('../models/Producto');
const Combo = require('../models/Combo');
const Usuario = require('../models/Usuario');
const Counter = require('../models/Counter');
const PDFDocument = require('pdfkit');

const listarVentas = async (req, res) => {
  try {
    const { start, end, vendedorId, limit } = req.query;
    const filtro = {};

    if (start && end && start === end) {
      const offset = -3; // GMT-3
      const ini = new Date(start);
      ini.setUTCHours(0 - offset, 0, 0, 0);
      const fin = new Date(end);
      fin.setUTCHours(23 - offset, 59, 59, 999);
      filtro.fecha = { $gte: ini, $lte: fin };
    } else {
      if (start || end) filtro.fecha = {};
      if (start) filtro.fecha.$gte = new Date(start);
      if (end) {
        const offset = -3; // GMT-3
        const e = new Date(end);
        e.setUTCHours(23 - offset, 59, 59, 999);
        filtro.fecha.$lte = e;
      }
    }

    if (req.user?.rol === 'Administrador') {
      if (vendedorId) filtro.vendedor = vendedorId;
    } else if (req.user?.id) {
      filtro.vendedor = req.user.id;
    }

    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);

    const ventas = await Venta.find(filtro)
      .populate('vendedor', 'nombre email rol')
      .populate('productos.producto', 'nombre')
      .populate('combos.combo', 'nombre')
      .sort({ fecha: -1 })
      .limit(limitNum);

    res.status(200).json(ventas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al obtener ventas' });
  }
};

// Construye mapa productoId -> { cantidad, precioUnitario, costoUnitario } para decrementar stock
const registrarVenta = async (req, res) => {
  try {
    const { vendedorId, productosVendidos = [], combosVendidos = [], descuento = 0, medioPago = 'Efectivo' } = req.body;

    let vendedorIdFinal = vendedorId;
    if (req.user?.rol !== 'Administrador') {
      vendedorIdFinal = req.user?.id;
    } else if (!vendedorIdFinal) {
      vendedorIdFinal = req.user?.id;
    }

    if (!vendedorIdFinal || (productosVendidos.length === 0 && combosVendidos.length === 0)) {
      return res.status(400).json({ msg: 'Faltan datos: vendedorId y al menos un producto o combo son requeridos' });
    }

    const vendedor = await Usuario.findById(vendedorIdFinal);
    if (!vendedor) return res.status(404).json({ msg: 'Vendedor no encontrado' });

    let totalAntesDescuento = 0;
    let totalCosto = 0;
    const detallesProductos = [];
    const detallesCombos = [];
    const decrementos = new Map(); // productoId -> cantidad a descontar

    // 1. Procesar productos individuales
    for (const item of productosVendidos) {
      const productoDB = await Producto.findById(item.productoId);
      if (!productoDB) return res.status(404).json({ msg: `Producto no encontrado: ${item.productoId}` });
      if (item.cantidad <= 0) return res.status(400).json({ msg: 'La cantidad debe ser mayor que 0' });

      totalAntesDescuento += productoDB.precioVenta * item.cantidad;
      totalCosto += productoDB.costo * item.cantidad;

      detallesProductos.push({
        producto: productoDB._id,
        cantidad: item.cantidad,
        precioVentaHistorico: productoDB.precioVenta,
        costoHistorico: productoDB.costo
      });

      const key = productoDB._id.toString();
      decrementos.set(key, (decrementos.get(key) || 0) + item.cantidad);
    }

    // 2. Procesar combos
    for (const item of combosVendidos) {
      const comboDB = await Combo.findById(item.comboId).populate('items.producto');
      if (!comboDB) return res.status(404).json({ msg: `Combo no encontrado: ${item.comboId}` });
      if (item.cantidad <= 0) return res.status(400).json({ msg: 'La cantidad debe ser mayor que 0' });

      let costoCombo = 0;
      for (const it of comboDB.items) {
        if (!it.producto) return res.status(404).json({ msg: 'Producto del combo no encontrado' });
        costoCombo += it.producto.costo * it.cantidad;
        const key = it.producto._id.toString();
        decrementos.set(key, (decrementos.get(key) || 0) + it.cantidad * item.cantidad);
      }

      totalAntesDescuento += comboDB.precioVenta * item.cantidad;
      totalCosto += costoCombo * item.cantidad;

      detallesCombos.push({
        combo: comboDB._id,
        cantidad: item.cantidad,
        precioVentaHistorico: comboDB.precioVenta,
        costoHistorico: costoCombo
      });
    }

    const descuentoNum = Math.max(0, parseFloat(descuento) || 0);
    const totalVenta = Math.max(0, totalAntesDescuento - descuentoNum);
    const gananciaNeta = totalVenta - totalCosto;

    const medioPagoValido = ['Efectivo', 'Tarjeta', 'Transferencia', 'Otro'].includes(medioPago) ? medioPago : 'Efectivo';

    // 3. Verificar stock para todos los decrementos
    for (const [productoId, cantidad] of decrementos) {
      const prod = await Producto.findById(productoId);
      if (!prod) return res.status(404).json({ msg: 'Producto no encontrado' });
      if (prod.stock < cantidad) {
        return res.status(409).json({ msg: `Stock insuficiente para ${prod.nombre} (necesita ${cantidad}, hay ${prod.stock})` });
      }
    }

    // 4. Transacción: decrementar stock y crear venta
    const session = await Producto.startSession();
    let nuevaVenta;
    try {
      session.startTransaction();

      for (const [productoId, cantidad] of decrementos) {
        const updated = await Producto.findOneAndUpdate(
          { _id: productoId, stock: { $gte: cantidad } },
          { $inc: { stock: -cantidad } },
          { new: true, session }
        );
        if (!updated) {
          await session.abortTransaction();
          return res.status(409).json({ msg: `Stock insuficiente para el producto ${productoId}` });
        }
      }

      const cnt = await Counter.findByIdAndUpdate({ _id: 'venta' }, { $inc: { seq: 1 } }, { upsert: true, new: true, session });

      nuevaVenta = new Venta({
        vendedor: vendedorIdFinal,
        productos: detallesProductos,
        combos: detallesCombos,
        totalAntesDescuento,
        descuento: descuentoNum,
        totalVenta,
        totalCosto,
        gananciaNeta,
        medioPago: medioPagoValido,
        facturaNumero: cnt.seq
      });
      await nuevaVenta.save({ session });

      await session.commitTransaction();
    } catch (txErr) {
      try {
        await session.abortTransaction();
      } catch (e) { /* ignore */ }
      const updatedProducts = [];
      for (const [productoId, cantidad] of decrementos) {
        const updated = await Producto.findOneAndUpdate(
          { _id: productoId, stock: { $gte: cantidad } },
          { $inc: { stock: -cantidad } },
          { new: true }
        );
        if (!updated) {
          for (const u of updatedProducts) {
            await Producto.findByIdAndUpdate(u.id, { $inc: { stock: u.cantidad } });
          }
          return res.status(409).json({ msg: `Stock insuficiente para el producto ${productoId}` });
        }
        updatedProducts.push({ id: productoId, cantidad });
      }
      const cnt = await Counter.findByIdAndUpdate({ _id: 'venta' }, { $inc: { seq: 1 } }, { upsert: true, new: true });
      nuevaVenta = new Venta({
        vendedor: vendedorIdFinal,
        productos: detallesProductos,
        combos: detallesCombos,
        totalAntesDescuento,
        descuento: descuentoNum,
        totalVenta,
        totalCosto,
        gananciaNeta,
        medioPago: medioPagoValido,
        facturaNumero: cnt.seq
      });
      await nuevaVenta.save();
    } finally {
      session.endSession();
    }

    res.status(201).json({ msg: 'Venta registrada con éxito', venta: nuevaVenta });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al registrar la venta' });
  }
};

const exportVenta = async (req, res) => {
  try {
    const { id } = req.params;
    const { format } = req.query;
    const venta = await Venta.findById(id).populate('vendedor productos.producto combos.combo');
    if (!venta) return res.status(404).json({ msg: 'Venta no encontrada' });

    if (format === 'csv') {
      let csv = 'facturaNumero,fecha,vendedor,medioPago,totalAntesDescuento,descuento,totalVenta,totalCosto,gananciaNeta\n';
      csv += `${venta.facturaNumero || ''},${venta.fecha.toISOString()},${venta.vendedor.nombre || ''},${venta.medioPago || ''},${venta.totalAntesDescuento || venta.totalVenta},${venta.descuento || 0},${venta.totalVenta},${venta.totalCosto},${venta.gananciaNeta}\n\n`;
      csv += 'producto/combo,cantidad,precioVentaHistorico,costoHistorico\n';
      for (const p of venta.productos) {
        const nombre = p.producto ? p.producto.nombre : p.producto;
        csv += `${nombre},${p.cantidad},${p.precioVentaHistorico},${p.costoHistorico}\n`;
      }
      for (const c of venta.combos || []) {
        const nombre = c.combo ? c.combo.nombre : c.combo;
        csv += `${nombre} (combo),${c.cantidad},${c.precioVentaHistorico},${c.costoHistorico}\n`;
      }
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=venta_${venta._id}.csv`);
      return res.send(csv);
    }

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=venta_${venta._id}.pdf`);
    doc.pipe(res);

    const formatMoney = (value) => `$${Number(value || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const formatDate = (value) => new Date(value).toLocaleString('es-AR');

    const vendedorNombre = venta.vendedor?.nombre || 'Sin vendedor';
    const medioPagoNombre = venta.medioPago || 'Efectivo';

    doc.fontSize(22).text('FIXCEL', { align: 'left' });
    doc.fontSize(10).fillColor('#666666').text('Comprobante de venta', { align: 'left' });
    doc.fillColor('#000000');

    doc.moveDown(1);
    doc.fontSize(12).text(`Factura N°: ${venta.facturaNumero || '-'}`);
    doc.text(`Fecha: ${formatDate(venta.fecha)}`);
    doc.text(`Vendedor: ${vendedorNombre}`);
    doc.text(`Medio de pago: ${medioPagoNombre}`);

    doc.moveDown(1.2);
    doc.fontSize(12).text('Detalle', { underline: true });
    doc.moveDown(0.4);

    const colItem = 40;
    const colCant = 330;
    const colPrecio = 395;
    const colSubtotal = 485;

    doc.fontSize(10).fillColor('#555555');
    doc.text('Ítem', colItem, doc.y);
    doc.text('Cant.', colCant, doc.y, { width: 45, align: 'right' });
    doc.text('P. Unit.', colPrecio, doc.y, { width: 75, align: 'right' });
    doc.text('Subtotal', colSubtotal, doc.y, { width: 85, align: 'right' });
    doc.fillColor('#000000');
    doc.moveDown(0.3);

    doc.moveTo(colItem, doc.y).lineTo(555, doc.y).strokeColor('#DDDDDD').stroke();
    doc.moveDown(0.6);

    const addRow = (descripcion, cantidad, precioUnitario) => {
      const subtotal = (Number(cantidad) || 0) * (Number(precioUnitario) || 0);
      doc.fontSize(10).text(descripcion, colItem, doc.y, { width: 275 });
      doc.text(String(cantidad || 0), colCant, doc.y - 12, { width: 45, align: 'right' });
      doc.text(formatMoney(precioUnitario), colPrecio, doc.y - 12, { width: 75, align: 'right' });
      doc.text(formatMoney(subtotal), colSubtotal, doc.y - 12, { width: 85, align: 'right' });
      doc.moveDown(0.6);
    };

    for (const p of venta.productos) {
      const nombre = p.producto ? p.producto.nombre : 'Producto';
      addRow(nombre, p.cantidad, p.precioVentaHistorico);
    }

    for (const c of (venta.combos || [])) {
      const nombre = c.combo ? `${c.combo.nombre} (Combo)` : 'Combo';
      addRow(nombre, c.cantidad, c.precioVentaHistorico);
    }

    doc.moveDown(0.4);
    doc.moveTo(colPrecio, doc.y).lineTo(555, doc.y).strokeColor('#DDDDDD').stroke();
    doc.moveDown(0.6);

    const subtotal = Number(venta.totalAntesDescuento || venta.totalVenta || 0);
    const descuento = Number(venta.descuento || 0);
    const total = Number(venta.totalVenta || 0);
    const costo = Number(venta.totalCosto || 0);
    const ganancia = Number(venta.gananciaNeta || 0);

    doc.fontSize(10);
    doc.text('Subtotal:', colPrecio, doc.y, { width: 75, align: 'right' });
    doc.text(formatMoney(subtotal), colSubtotal, doc.y - 12, { width: 85, align: 'right' });
    doc.moveDown(0.4);

    if (descuento > 0) {
      doc.text('Descuento:', colPrecio, doc.y, { width: 75, align: 'right' });
      doc.text(`-${formatMoney(descuento)}`, colSubtotal, doc.y - 12, { width: 85, align: 'right' });
      doc.moveDown(0.4);
    }

    doc.fontSize(12).text('TOTAL:', colPrecio, doc.y, { width: 75, align: 'right' });
    doc.text(formatMoney(total), colSubtotal, doc.y - 14, { width: 85, align: 'right' });
    doc.moveDown(1);

    doc.fontSize(10).fillColor('#333333');
    doc.text(`Costo total: ${formatMoney(costo)}`);
    doc.text(`Ganancia neta: ${formatMoney(ganancia)}`);
    doc.moveDown(1.2);
    doc.fillColor('#666666').fontSize(9).text('Este comprobante es de uso interno y no reemplaza factura fiscal.', { align: 'center' });

    doc.end();
    return;
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error al exportar venta' });
  }
};

module.exports = { listarVentas, registrarVenta, exportVenta };
