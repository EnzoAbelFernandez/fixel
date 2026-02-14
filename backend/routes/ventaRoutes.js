const express = require('express');
const router = express.Router();
const { registrarVenta, exportVenta } = require('../controllers/ventaController');
const { auth } = require('../middleware/auth');

// Registrar venta -> cualquier usuario autenticado (Vendedor o Administrador)
router.post('/', auth, registrarVenta);
// Exportar una venta (CSV o PDF) -> cualquier usuario autenticado
router.get('/:id/export', auth, exportVenta);

module.exports = router;