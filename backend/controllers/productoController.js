const Producto = require('../models/Producto');
const Counter = require('../models/Counter');

// @desc    Crear un nuevo producto
// @route   POST /api/productos
const crearProducto = async (req, res) => {
  try {

    const { nombre, categoria, codigoBarras, costo, precioVenta, stock } = req.body;
    if (!nombre || !categoria || !costo || !precioVenta) {
      return res.status(400).json({ msg: 'Por favor, completá todos los campos obligatorios' });
    }

    // Validar que la categoría exista
    const Categoria = require('../models/Categoria');
    const cat = await Categoria.findById(categoria);
    if (!cat) return res.status(400).json({ msg: 'Categoría no válida' });

    const nuevoProducto = new Producto({
      nombre,
      categoria,
      codigoBarras: codigoBarras || null,
      costo,
      precioVenta,
      stock: stock || 0
    });

    if (!nuevoProducto.codigoInterno) {
      const counter = await Counter.findByIdAndUpdate({ _id: 'producto' }, { $inc: { seq: 1 } }, { upsert: true, new: true });
      nuevoProducto.codigoInterno = `P-${String(counter.seq).padStart(6, '0')}`;
    }

    const productoGuardado = await nuevoProducto.save();
    await productoGuardado.populate('categoria');
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
    const productos = await Producto.find().populate('categoria').sort({ nombre: 1 });
    res.status(200).json(productos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al obtener los productos' });
  }
};

// Editar producto
const editarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    // Validar categoría si se actualiza
    if (updates.categoria) {
      const Categoria = require('../models/Categoria');
      const cat = await Categoria.findById(updates.categoria);
      if (!cat) return res.status(400).json({ msg: 'Categoría no válida' });
    }
    const producto = await Producto.findByIdAndUpdate(id, updates, { new: true }).populate('categoria');
    if (!producto) return res.status(404).json({ msg: 'Producto no encontrado' });
    res.status(200).json({ msg: 'Producto actualizado', producto });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error al actualizar producto' });
  }
};

// Eliminar producto
const eliminarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const producto = await Producto.findByIdAndDelete(id);
    if (!producto) return res.status(404).json({ msg: 'Producto no encontrado' });
    res.status(200).json({ msg: 'Producto eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error al eliminar producto' });
  }
};

module.exports = {
  crearProducto,
  obtenerProductos
  , editarProducto, eliminarProducto
};
