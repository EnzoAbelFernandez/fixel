const express = require('express');
const router = express.Router();
const { ventasPorPeriodo, perdidasPorPeriodo, balanceGeneral } = require('../controllers/reporteController');
const { auth, authorize } = require('../middleware/auth');

// Reportes protegidos (Administrador)
router.get('/ventas', auth, authorize('Administrador'), ventasPorPeriodo);
router.get('/perdidas', auth, authorize('Administrador'), perdidasPorPeriodo);
router.get('/balance', auth, authorize('Administrador'), balanceGeneral);

module.exports = router;
