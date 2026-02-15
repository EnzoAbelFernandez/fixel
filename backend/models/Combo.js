const mongoose = require('mongoose');

const comboSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  items: [{
    producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto', required: true },
    cantidad: { type: Number, required: true }
  }],
  precioVenta: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Combo', comboSchema);
