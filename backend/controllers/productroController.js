const Producto = require('../models/Producto');

// @desc    Crear un nuevo producto
// @route   POST /api/productos
const crearProducto = async (req, res) => {
  try {
    const { nombre, categoria, codigoBarras, costo, precioVenta, stock } = req.body;

    // Validación básica
    if (!nombre || !categoria || !costo || !precioVenta) {
      return res.status(400).json({ msg: 'Por favor, completá todos los campos obligatorios' });
    }

    const nuevoProducto = new Producto({
      nombre,
      categoria,
      codigoBarras: codigoBarras || null,
      costo,
      precioVenta,
      stock: stock || 0
    });

    const productoGuardado = await nuevoProducto.save();
    res.status(201).json({ msg: 'Producto creado exitosamente', producto: productoGuardado });

  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al crear el producto' });
  }
};

// @desc    Obtener todos los productos (Stock disponible)
// @route   GET /api/productos
const obtenerProductos = async (req, res) => {
  try {
    // Busca todos los productos y los ordena por nombre alfabéticamente
    const productos = await Producto.find().sort({ nombre: 1 });
    res.status(200).json(productos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al obtener los productos' });
  }
};

module.exports = {
  crearProducto,
  obtenerProductos
};