// models/Venta.js
const mongoose = require('mongoose');

const ventaSchema = new mongoose.Schema({
  vendedor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  productos: [{
    producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto', required: true },
    cantidad: { type: Number, required: true },
    precioVentaHistorico: { type: Number, required: true }, 
    costoHistorico: { type: Number, required: true } 
  }],
  totalVenta: { type: Number, required: true }, 
  totalCosto: { type: Number, required: true },
  gananciaNeta: { type: Number, required: true }, 
  facturaNumero: { type: Number, unique: true, sparse: true },
  fecha: { type: Date, default: Date.now }
});

// Exportamos Venta y ventaSchema
module.exports = mongoose.model('Venta', ventaSchema);