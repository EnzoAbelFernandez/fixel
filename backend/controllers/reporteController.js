const Venta = require('../models/Venta');
const GarantiaPerdida = require('../models/GarantiaPerdida');

// Ventas por periodo: suma totalVenta, cantidad de ventas y productos vendidos
const ventasPorPeriodo = async (req, res) => {
  try {
    const { start, end } = req.query;
    const match = {};
    if (start || end) match.fecha = {};
    if (start) match.fecha.$gte = new Date(start);
    if (end) {
      const e = new Date(end);
      e.setHours(23,59,59,999);
      match.fecha.$lte = e;
    }

    const agg = [
      { $match: match },
      { $addFields: {
        itemsSum: { $sum: { $ifNull: ['$productos.cantidad', []] } },
        combosSum: { $sum: { $ifNull: ['$combos.cantidad', []] } }
      }},
      { $group: {
        _id: null,
        totalIngresos: { $sum: '$totalVenta' },
        totalCosto: { $sum: '$totalCosto' },
        cantidadVentas: { $sum: 1 },
        cantidadProductos: { $sum: { $add: [{ $ifNull: ['$itemsSum', 0] }, { $ifNull: ['$combosSum', 0] }] } }
      }},
      { $project: { _id: 0, totalIngresos: 1, totalCosto: 1, cantidadVentas: 1, cantidadProductos: 1, gananciaNeta: { $subtract: ['$totalIngresos', '$totalCosto'] } } }
    ];

    const resAgg = await Venta.aggregate(agg);
    const r = resAgg[0] || { totalIngresos: 0, totalCosto: 0, cantidadVentas: 0, cantidadProductos: 0, gananciaNeta: 0 };
    res.status(200).json({ ...r, cantidadVendida: r.cantidadProductos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error al generar reporte de ventas' });
  }
};

// Pérdidas por periodo
const perdidasPorPeriodo = async (req, res) => {
  try {
    const { start, end } = req.query;
    const filtro = {};
    if (start || end) filtro.fecha = {};
    if (start) filtro.fecha.$gte = new Date(start);
    if (end) {
      const e = new Date(end);
      e.setHours(23,59,59,999);
      filtro.fecha.$lte = e;
    }

    const agg = [
      { $match: filtro },
      { $group: { _id: null, totalPerdido: { $sum: '$costoPerdido' }, cantidadPerdida: { $sum: '$cantidad' } } },
      { $project: { _id: 0, totalPerdido: 1, cantidadPerdida: 1 } }
    ];

    const resAgg = await GarantiaPerdida.aggregate(agg);
    res.status(200).json(resAgg[0] || { totalPerdido: 0, cantidadPerdida: 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error al generar reporte de pérdidas' });
  }
};

// Balance general: ingresos - costos - perdidas
const balanceGeneral = async (req, res) => {
  try {
    // Reusar ventasPorPeriodo y perdidasPorPeriodo logic but for all time or filtered by query
    const { start, end } = req.query;
    const match = {};
    if (start || end) match.fecha = {};
    if (start) match.fecha.$gte = new Date(start);
    if (end) {
      const e = new Date(end);
      e.setHours(23,59,59,999);
      match.fecha.$lte = e;
    }

    const ventasAgg = [
      { $match: match },
      { $group: { _id: null, totalIngresos: { $sum: '$totalVenta' }, totalCosto: { $sum: '$totalCosto' } } },
      { $project: { _id: 0, totalIngresos: 1, totalCosto: 1, gananciaNeta: { $subtract: ['$totalIngresos', '$totalCosto'] } } }
    ];

    const ventasRes = await Venta.aggregate(ventasAgg);
    const ventas = ventasRes[0] || { totalIngresos: 0, totalCosto: 0, gananciaNeta: 0 };

    const perdidasFiltro = {};
    if (start || end) perdidasFiltro.fecha = {};
    if (start) perdidasFiltro.fecha.$gte = new Date(start);
    if (end) {
      const e2 = new Date(end);
      e2.setHours(23,59,59,999);
      perdidasFiltro.fecha.$lte = e2;
    }

    const perdidasAgg = [
      { $match: perdidasFiltro },
      { $group: { _id: null, totalPerdido: { $sum: '$costoPerdido' } } },
      { $project: { _id: 0, totalPerdido: 1 } }
    ];

    const perdidasRes = await GarantiaPerdida.aggregate(perdidasAgg);
    const perdidas = perdidasRes[0] || { totalPerdido: 0 };

    const balance = {
      ingresos: ventas.totalIngresos || 0,
      costos: ventas.totalCosto || 0,
      gananciaNeta: (ventas.gananciaNeta || 0) - (perdidas.totalPerdido || 0),
      totalPerdido: perdidas.totalPerdido || 0
    };

    res.status(200).json(balance);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error al calcular balance' });
  }
};

module.exports = { ventasPorPeriodo, perdidasPorPeriodo, balanceGeneral };
