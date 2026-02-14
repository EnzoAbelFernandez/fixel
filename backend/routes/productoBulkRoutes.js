const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const { uploadCSV } = require('../controllers/productoBulkController');
const { auth, authorize } = require('../middleware/auth');

// Ruta para carga masiva por CSV, sólo Administrador
router.post('/upload', auth, authorize('Administrador'), upload.single('file'), uploadCSV);

module.exports = router;
