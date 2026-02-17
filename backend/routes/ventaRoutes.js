const express = require('express');
const router = express.Router();
const { listarVentas, registrarVenta, exportVenta } = require('../controllers/ventaController');
const { auth } = require('../middleware/auth');

// Listar ventas -> cualquier usuario autenticado (admin ve todas, vendedor solo las suyas)
router.get('/', auth, listarVentas);

// Registrar venta -> cualquier usuario autenticado (Vendedor o Administrador)
router.post('/', auth, registrarVenta);
// Exportar una venta (CSV o PDF) -> cualquier usuario autenticado
router.get('/:id/export', auth, exportVenta);

module.exports = router;