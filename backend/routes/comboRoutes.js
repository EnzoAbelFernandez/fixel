const express = require('express');
const router = express.Router();
const { crearCombo, obtenerCombos, editarCombo, eliminarCombo } = require('../controllers/comboController');
const { auth, authorize } = require('../middleware/auth');

router.get('/', auth, obtenerCombos);
// Crear, editar y eliminar combo -> Administrador o Vendedor
router.post('/', auth, authorize(['Administrador', 'Vendedor']), crearCombo);
router.put('/:id', auth, authorize(['Administrador', 'Vendedor']), editarCombo);
router.delete('/:id', auth, authorize(['Administrador', 'Vendedor']), eliminarCombo);

module.exports = router;
