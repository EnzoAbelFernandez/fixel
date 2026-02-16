// models/Producto.js
const mongoose = require('mongoose');

const productoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  categoria: { type: mongoose.Schema.Types.ObjectId, ref: 'Categoria', required: true },
  codigoBarras: { type: String, default: null }, 
  codigoInterno: { type: String, unique: true, sparse: true }, 
  costo: { type: Number, required: true }, 
  precioVenta: { type: Number, required: true },
  stock: { type: Number, default: 0, required: true },
}, { timestamps: true });

// Exportamos Producto y productoSchema
module.exports = mongoose.model('Producto', productoSchema);