const express = require('express');
const router = express.Router();
const { crearUsuario, listarUsuarios, actualizarUsuario, eliminarUsuario } = require('../controllers/usuarioController');
const { auth, authorize } = require('../middleware/auth');

// Admin only
router.post('/', auth, authorize('Administrador'), crearUsuario);
router.get('/', auth, authorize('Administrador'), listarUsuarios);
router.put('/:id', auth, authorize('Administrador'), actualizarUsuario);
router.delete('/:id', auth, authorize('Administrador'), eliminarUsuario);

module.exports = router;
