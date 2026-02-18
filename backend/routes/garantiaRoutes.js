const express = require('express');
const router = express.Router();
const { registrarGarantia, obtenerGarantias } = require('../controllers/garantiaController');
const { auth, authorize } = require('../middleware/auth');

// Registrar y listar garantías/pérdidas -> sólo Administrador (el vendedor no ve Garantías)
router.post('/', auth, authorize('Administrador'), registrarGarantia);
router.get('/', auth, authorize('Administrador'), obtenerGarantias);

module.exports = router;
