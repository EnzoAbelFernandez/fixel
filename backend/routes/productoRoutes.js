const express = require('express');
const router = express.Router();
const { crearProducto, obtenerProductos, editarProducto, eliminarProducto } = require('../controllers/productoController');
const { auth, authorize } = require('../middleware/auth');

// Obtener productos -> cualquier usuario autenticado
router.get('/', auth, obtenerProductos);

// Crear producto -> sólo Administrador
router.post('/', auth, authorize('Administrador'), crearProducto);

// Editar producto -> sólo Administrador
router.put('/:id', auth, authorize('Administrador'), editarProducto);

// Eliminar producto -> sólo Administrador
router.delete('/:id', auth, authorize('Administrador'), eliminarProducto);

module.exports = router;