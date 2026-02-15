const express = require('express');
const router = express.Router();
const { crearCombo, obtenerCombos, editarCombo, eliminarCombo } = require('../controllers/comboController');
const { auth, authorize } = require('../middleware/auth');

router.get('/', auth, obtenerCombos);
router.post('/', auth, authorize('Administrador'), crearCombo);
router.put('/:id', auth, authorize('Administrador'), editarCombo);
router.delete('/:id', auth, authorize('Administrador'), eliminarCombo);

module.exports = router;
