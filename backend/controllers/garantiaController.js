const GarantiaPerdida = require('../models/GarantiaPerdida');
const Producto = require('../models/Producto');

// Registrar una garantía/pérdida: decrementa stock atómicamente y crea registro
const registrarGarantia = async (req, res) => {
  try {
    const { productoId, cantidad, motivo, vendedorId } = req.body;
    const vendedor = vendedorId || (req.user && req.user.id);

    if (!productoId || !cantidad || !motivo) return res.status(400).json({ msg: 'Faltan datos' });
    if (cantidad <= 0) return res.status(400).json({ msg: 'La cantidad debe ser mayor que 0' });

    // Intentar usar una transacción
    const session = await Producto.startSession();
    try {
      session.startTransaction();

      const productoActualizado = await Producto.findOneAndUpdate(
        { _id: productoId, stock: { $gte: cantidad } },
        { $inc: { stock: -cantidad } },
        { new: true, session }
      );
      if (!productoActualizado) {
        await session.abortTransaction();
        return res.status(409).json({ msg: 'Stock insuficiente o producto no encontrado' });
      }

      const costoPerdido = productoActualizado.costo * cantidad;

      const registro = new GarantiaPerdida({
        producto: productoId,
        vendedor: vendedor || null,
        cantidad,
        motivo,
        costoPerdido
      });
      await registro.save({ session });

      await session.commitTransaction();
      res.status(201).json({ msg: 'Garantía/pérdida registrada', garantia: registro });
    } catch (e) {
      try { await session.abortTransaction(); } catch (x) { /* ignore abort errors */ }
      // fallback
      const productoActualizado = await Producto.findOneAndUpdate(
        { _id: productoId, stock: { $gte: cantidad } },
        { $inc: { stock: -cantidad } },
        { new: true }
      );
      if (!productoActualizado) return res.status(409).json({ msg: 'Stock insuficiente o producto no encontrado' });
      const costoPerdido = productoActualizado.costo * cantidad;
      const registro = new GarantiaPerdida({ producto: productoId, vendedor: vendedor || null, cantidad, motivo, costoPerdido });
      await registro.save();
      res.status(201).json({ msg: 'Garantía/pérdida registrada', garantia: registro });
    } finally {
      session.endSession();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error al registrar garantía' });
  }
};

// Obtener garantías con filtros por fecha/producto
const obtenerGarantias = async (req, res) => {
  try {
    const { start, end, productoId } = req.query;
    const filtro = {};
    if (productoId) filtro.producto = productoId;
    if (start || end) filtro.fecha = {};
    if (start) filtro.fecha.$gte = new Date(start);
    if (end) {
      const e = new Date(end);
      e.setHours(23,59,59,999);
      filtro.fecha.$lte = e;
    }

    const garantias = await GarantiaPerdida.find(filtro).populate('producto vendedor').sort({ fecha: -1 });
    res.status(200).json(garantias);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error al obtener garantías' });
  }
};

module.exports = { registrarGarantia, obtenerGarantias };
