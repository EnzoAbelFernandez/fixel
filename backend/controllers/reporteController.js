const Venta = require('../models/Venta');
const GarantiaPerdida = require('../models/GarantiaPerdida');

const buildFechaFiltro = (start, end) => {
  const filtro = {};

  if (start && end && start === end) {
    const offset = -3; // GMT-3
    const ini = new Date(start);
    ini.setUTCHours(0 - offset, 0, 0, 0);
    const fin = new Date(end);
    fin.setUTCHours(23 - offset, 59, 59, 999);
    filtro.fecha = { $gte: ini, $lte: fin };
    return filtro;
  }

  if (start || end) filtro.fecha = {};
  if (start) filtro.fecha.$gte = new Date(start);
  if (end) {
    const offset = -3; // GMT-3
    const e = new Date(end);
    e.setUTCHours(23 - offset, 59, 59, 999);
    filtro.fecha.$lte = e;
  }

  return filtro;
};

// Ventas por periodo: suma totalVenta, cantidad de ventas y productos vendidos
const ventasPorPeriodo = async (req, res) => {
  try {
    const { start, end } = req.query;
    const match = buildFechaFiltro(start, end);

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
    const filtro = buildFechaFiltro(start, end);

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
    const { start, end } = req.query;
    const match = buildFechaFiltro(start, end);

    const ventasAgg = [
      { $match: match },
      { $group: { _id: null, totalIngresos: { $sum: '$totalVenta' }, totalCosto: { $sum: '$totalCosto' } } },
      { $project: { _id: 0, totalIngresos: 1, totalCosto: 1, gananciaNeta: { $subtract: ['$totalIngresos', '$totalCosto'] } } }
    ];

    const ventasRes = await Venta.aggregate(ventasAgg);
    const ventas = ventasRes[0] || { totalIngresos: 0, totalCosto: 0, gananciaNeta: 0 };

    const perdidasFiltro = buildFechaFiltro(start, end);

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
