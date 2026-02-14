const Producto = require('../models/Producto');
const csv = require('csv-parse');
const fs = require('fs');
const Counter = require('../models/Counter');

// Espera un archivo CSV con columnas: nombre,categoria,codigoBarras,costo,precioVenta,stock,codigoInterno
const uploadCSV = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: 'Archivo CSV requerido' });

    const path = req.file.path;
    const parser = fs.createReadStream(path).pipe(csv.parse({ columns: true, skip_empty_lines: true, trim: true }));

    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors = [];

    for await (const record of parser) {
      try {
        const nombre = record.nombre || record.name;
        const categoria = record.categoria || record.category;
        const codigoBarras = record.codigoBarras || record.barcode || null;
        const codigoInterno = record.codigoInterno || record.codigo || null;
        const costo = parseFloat(record.costo || 0);
        const precioVenta = parseFloat(record.precioVenta || record.price || 0);
        const stock = parseInt(record.stock || 0, 10) || 0;

        if (!nombre || !categoria || !costo || !precioVenta) {
          skipped++;
          continue;
        }

        // Buscar por codigoInterno o codigoBarras o nombre+categoria
        let producto = null;
        if (codigoInterno) producto = await Producto.findOne({ codigoInterno });
        if (!producto && codigoBarras) producto = await Producto.findOne({ codigoBarras });
        if (!producto) producto = await Producto.findOne({ nombre, categoria });

        if (producto) {
          producto.costo = costo;
          producto.precioVenta = precioVenta;
          producto.stock = stock;
          producto.codigoBarras = codigoBarras || producto.codigoBarras;
          producto.codigoInterno = codigoInterno || producto.codigoInterno;
          await producto.save();
          updated++;
        } else {
          const nuevo = new Producto({ nombre, categoria, codigoBarras, codigoInterno, costo, precioVenta, stock });
          if (!nuevo.codigoInterno) {
            const counter = await Counter.findByIdAndUpdate({ _id: 'producto' }, { $inc: { seq: 1 } }, { upsert: true, new: true });
            nuevo.codigoInterno = `P-${String(counter.seq).padStart(6, '0')}`;
          }
          await nuevo.save();
          created++;
        }
      } catch (err) {
        errors.push({ row: record, error: err.message });
      }
    }

    // Borrar archivo temporal
    fs.unlinkSync(path);

    res.status(200).json({ msg: 'Importación completada', created, updated, skipped, errors });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error al procesar CSV', error: err.message });
  }
};

module.exports = { uploadCSV };
