const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const conectarDB = require('./config/db');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/ventas', require('./routes/ventaRoutes'));
app.use('/api/productos/bulk', require('./routes/productoBulkRoutes'));
app.use('/api/productos', require('./routes/productoRoutes'));
app.use('/api/combos', require('./routes/comboRoutes'));
app.use('/api/garantias', require('./routes/garantiaRoutes'));
app.use('/api/reportes', require('./routes/reporteRoutes'));
app.use('/api/usuarios', require('./routes/usuarioRoutes'));

module.exports = { app, conectarDB };
