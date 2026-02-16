const express = require('express')
const router = express.Router()
const categoriaController = require('../controllers/categoriaController')

const { auth, authorize } = require('../middleware/auth')


router.get('/', auth, categoriaController.list)
router.post('/', auth, authorize('Administrador'), categoriaController.create)
router.put('/:id', auth, authorize('Administrador'), categoriaController.update)
router.delete('/:id', auth, authorize('Administrador'), categoriaController.delete)

module.exports = router
