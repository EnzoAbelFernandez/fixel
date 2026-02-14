const Venta = require('../models/Venta');
const Producto = require('../models/Producto');
const Usuario = require('../models/Usuario');
const Counter = require('../models/Counter');
const PDFDocument = require('pdfkit');
const stream = require('stream');

// Registrar venta con decremento atómico de stock por producto.
// Si algún decremento falla por stock insuficiente, se revierte lo hecho.
const registrarVenta = async (req, res) => {
  try {
    const { vendedorId, productosVendidos } = req.body;
    // productosVendidos será un array de objetos: [{ productoId: '...', cantidad: 2 }]

    if (!vendedorId || !Array.isArray(productosVendidos) || productosVendidos.length === 0) {
      return res.status(400).json({ msg: 'Faltan datos: vendedorId y productosVendidos son requeridos' });
    }

    // Verificar vendedor
    const vendedor = await Usuario.findById(vendedorId);
    if (!vendedor) return res.status(404).json({ msg: 'Vendedor no encontrado' });

    let totalVenta = 0;
    let totalCosto = 0;
    const detallesProductos = [];

    // 1. Recopilar información y preparar operaciones atómicas
    for (let item of productosVendidos) {
      const productoDB = await Producto.findById(item.productoId);
      if (!productoDB) return res.status(404).json({ msg: `Producto no encontrado: ${item.productoId}` });
      if (item.cantidad <= 0) return res.status(400).json({ msg: 'La cantidad debe ser mayor que 0' });

      totalVenta += productoDB.precioVenta * item.cantidad;
      totalCosto += productoDB.costo * item.cantidad;

      detallesProductos.push({
        producto: productoDB._id,
        cantidad: item.cantidad,
        precioVentaHistorico: productoDB.precioVenta,
        costoHistorico: productoDB.costo
      });
    }

    const gananciaNeta = totalVenta - totalCosto;

    // 2. Intentar decrementar stock y crear venta en una transacción si es posible
    const session = await Producto.startSession();
    let nuevaVenta;
    try {
      session.startTransaction();

      // Decrementos atómicos con la sesión
      for (let item of productosVendidos) {
        const updated = await Producto.findOneAndUpdate(
          { _id: item.productoId, stock: { $gte: item.cantidad } },
          { $inc: { stock: -item.cantidad } },
          { new: true, session }
        );
        if (!updated) {
          await session.abortTransaction();
          return res.status(409).json({ msg: `Stock insuficiente para el producto ${item.productoId}` });
        }
      }

      // Generar facturaNumero secuencial
      const cnt = await Counter.findByIdAndUpdate({ _id: 'venta' }, { $inc: { seq: 1 } }, { upsert: true, new: true, session });

      // Crear la venta dentro de la transacción
      nuevaVenta = new Venta({
        vendedor: vendedorId,
        productos: detallesProductos,
        totalVenta,
        totalCosto,
        gananciaNeta,
        facturaNumero: cnt.seq
      });
      await nuevaVenta.save({ session });

      await session.commitTransaction();
    } catch (txErr) {
      // Si las transacciones no están soportadas, fallback al método anterior
      try {
        await session.abortTransaction();
      } catch (e) { /* ignore abort errors */ }
      // Fallback: intentar decrementos sin transacción (ya implementado antes)
      const updatedProducts = [];
      for (let item of productosVendidos) {
        const updated = await Producto.findOneAndUpdate(
          { _id: item.productoId, stock: { $gte: item.cantidad } },
          { $inc: { stock: -item.cantidad } },
          { new: true }
        );
        if (!updated) {
          for (let u of updatedProducts) {
            await Producto.findByIdAndUpdate(u._id, { $inc: { stock: u.cantidad } });
          }
          return res.status(409).json({ msg: `Stock insuficiente para el producto ${item.productoId}` });
        }
        updatedProducts.push({ _id: updated._id, cantidad: item.cantidad });
      }

      const cnt = await Counter.findByIdAndUpdate({ _id: 'venta' }, { $inc: { seq: 1 } }, { upsert: true, new: true });
      nuevaVenta = new Venta({
        vendedor: vendedorId,
        productos: detallesProductos,
        totalVenta,
        totalCosto,
        gananciaNeta,
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

module.exports = { registrarVenta };

// Exportar venta como CSV o PDF
const exportVenta = async (req, res) => {
  try {
    const { id } = req.params;
    const { format } = req.query; // 'csv' or 'pdf'
    const venta = await Venta.findById(id).populate('vendedor productos.producto');
    if (!venta) return res.status(404).json({ msg: 'Venta no encontrada' });

    if (format === 'csv') {
      // Crear CSV simple
      let csv = 'facturaNumero,fecha,vendedor,totalVenta,totalCosto,gananciaNeta\n';
      csv += `${venta.facturaNumero || ''},${venta.fecha.toISOString()},${venta.vendedor.nombre || ''},${venta.totalVenta},${venta.totalCosto},${venta.gananciaNeta}\n\n`;
      csv += 'producto,cantidad,precioVentaHistorico,costoHistorico\n';
      for (const p of venta.productos) {
        const nombre = p.producto ? p.producto.nombre : p.producto;
        csv += `${nombre},${p.cantidad},${p.precioVentaHistorico},${p.costoHistorico}\n`;
      }
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=venta_${venta._id}.csv`);
      return res.send(csv);
    }

    // PDF
    const doc = new PDFDocument();
    const passthrough = new stream.PassThrough();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=venta_${venta._id}.pdf`);
    doc.pipe(passthrough);
    doc.fontSize(16).text(`Factura #${venta.facturaNumero || ''}`, { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(`Fecha: ${venta.fecha.toISOString()}`);
    doc.text(`Vendedor: ${venta.vendedor.nombre || ''}`);
    doc.moveDown();
    doc.text('Productos:');
    venta.productos.forEach(p => {
      const nombre = p.producto ? p.producto.nombre : p.producto;
      doc.text(`- ${nombre} x${p.cantidad} @ ${p.precioVentaHistorico} (costo ${p.costoHistorico})`);
    });
    doc.moveDown();
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