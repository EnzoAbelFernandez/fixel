const express = require('express');
const router = express.Router();
const { registrarGarantia, obtenerGarantias } = require('../controllers/garantiaController');
const { auth, authorize } = require('../middleware/auth');

// Registrar garantia/pérdida -> usuario autenticado
router.post('/', auth, registrarGarantia);

// Obtener garantias -> Administrador
router.get('/', auth, authorize('Administrador'), obtenerGarantias);

module.exports = router;
