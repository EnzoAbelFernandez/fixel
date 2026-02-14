// models/GarantiaPerdida.js
const mongoose = require('mongoose');

const garantiaSchema = new mongoose.Schema({
  producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto', required: true },
  vendedor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }, // Quién registró la pérdida
  cantidad: { type: Number, required: true },
  motivo: { type: String, required: true }, // Ej: "Falla de fábrica", "Cable roto"
  costoPerdido: { type: Number, required: true }, // Cuánta plata se perdió (calculado del costo del producto)
  fecha: { type: Date, default: Date.now }
});

module.exports = mongoose.models.GarantiaPerdida || mongoose.model('GarantiaPerdida', garantiaSchema);