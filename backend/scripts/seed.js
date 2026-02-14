require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Usuario = require('../models/Usuario');
const Producto = require('../models/Producto');

const uri = process.env.MONGO_URI;

const seed = async () => {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('Conectado a DB para seed');

    // Usuario admin de ejemplo
    const email = 'admin@fixel.local';
    let admin = await Usuario.findOne({ email });
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('admin123', salt);
    if (!admin) {
      admin = new Usuario({ nombre: 'Admin', email, password: hash, rol: 'Administrador' });
      await admin.save();
      console.log('Usuario admin creado:', admin._id.toString(), ' password: admin123');
    } else {
      // Forzamos actualización de contraseña del admin para ambientes de desarrollo
      admin.password = hash;
      await admin.save();
      console.log('Usuario admin ya existía. Contraseña actualizada (dev).', admin._id.toString());
    }

    // Producto ejemplo
    const nombreProd = 'Cargador Rápido 20W USB-C';
    let producto = await Producto.findOne({ nombre: nombreProd });
    if (!producto) {
      producto = new Producto({
        nombre: nombreProd,
        categoria: 'Cargadores',
        costo: 4500,
        precioVenta: 12000,
        stock: 15
      });
      await producto.save();
      console.log('Producto creado:', producto._id.toString());
    } else {
      console.log('Producto ya existe:', producto._id.toString());
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Error en seed:', err.message);
    process.exit(1);
  }
};

seed();
