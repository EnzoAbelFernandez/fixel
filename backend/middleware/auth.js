const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ msg: 'No autorizado' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_dev');
    const usuario = await Usuario.findById(decoded.id);
    if (!usuario) return res.status(401).json({ msg: 'Usuario no encontrado' });

    req.user = { id: usuario._id, rol: usuario.rol };
    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ msg: 'Token inválido' });
  }
};

// Middleware para roles: pasa 'Administrador' o 'Vendedor'
const authorize = (roles = []) => {
  if (typeof roles === 'string') roles = [roles];
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ msg: 'No autorizado' });
    if (roles.length && !roles.includes(req.user.rol)) return res.status(403).json({ msg: 'Acceso denegado' });
    next();
  };
};

module.exports = { auth, authorize };
