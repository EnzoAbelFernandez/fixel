const express = require('express');
const router = express.Router();
const { crearProducto, obtenerProductos, editarProducto, eliminarProducto } = require('../controllers/productoController');
const { auth, authorize } = require('../middleware/auth');

// Obtener productos -> cualquier usuario autenticado
router.get('/', auth, obtenerProductos);

// Crear y editar producto (actualizar stock) -> Administrador o Vendedor
router.post('/', auth, authorize(['Administrador', 'Vendedor']), crearProducto);
router.put('/:id', auth, authorize(['Administrador', 'Vendedor']), editarProducto);
// Eliminar producto -> sólo Administrador (el vendedor no puede eliminar)
router.delete('/:id', auth, authorize('Administrador'), eliminarProducto);

module.exports = router;