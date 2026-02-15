const Venta = require('../models/Venta');
const Producto = require('../models/Producto');
const Combo = require('../models/Combo');
const Usuario = require('../models/Usuario');
const Counter = require('../models/Counter');
const PDFDocument = require('pdfkit');
const stream = require('stream');

// Construye mapa productoId -> { cantidad, precioUnitario, costoUnitario } para decrementar stock
const registrarVenta = async (req, res) => {
  try {
    const { vendedorId, productosVendidos = [], combosVendidos = [], descuento = 0, medioPago = 'Efectivo' } = req.body;

    if (!vendedorId || (productosVendidos.length === 0 && combosVendidos.length === 0)) {
      return res.status(400).json({ msg: 'Faltan datos: vendedorId y al menos un producto o combo son requeridos' });
    }

    const vendedor = await Usuario.findById(vendedorId);
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
        vendedor: vendedorId,
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
        vendedor: vendedorId,
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

    const doc = new PDFDocument();
    const passthrough = new stream.PassThrough();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=venta_${venta._id}.pdf`);
    doc.pipe(passthrough);
    doc.fontSize(16).text(`Factura #${venta.facturaNumero || ''}`, { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(`Fecha: ${venta.fecha.toISOString()}`);
    doc.text(`Vendedor: ${venta.vendedor.nombre || ''}`);
    doc.text(`Medio de pago: ${venta.medioPago || 'Efectivo'}`);
    doc.moveDown();
    doc.text('Productos:');
    venta.productos.forEach(p => {
      const nombre = p.producto ? p.producto.nombre : p.producto;
      doc.text(`- ${nombre} x${p.cantidad} @ ${p.precioVentaHistorico} (costo ${p.costoHistorico})`);
    });
    (venta.combos || []).forEach(c => {
      const nombre = c.combo ? c.combo.nombre : c.combo;
      doc.text(`- ${nombre} x${c.cantidad} (combo) @ ${c.precioVentaHistorico}`);
    });
    doc.moveDown();
    if (venta.descuento > 0) {
      doc.text(`Subtotal: ${venta.totalAntesDescuento}`);
      doc.text(`Descuento: -${venta.descuento}`);
    }
    doc.text(`Total venta: ${venta.totalVenta}`);
    doc.text(`Total costo: ${venta.totalCosto}`);
    doc.text(`Ganancia neta: ${venta.gananciaNeta}`);
    doc.end();
    return doc.pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error al exportar venta' });
  }
};

module.exports = { registrarVenta, exportVenta };
