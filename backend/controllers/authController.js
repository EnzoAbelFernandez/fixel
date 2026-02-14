const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const registrar = async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;
    if (!nombre || !email || !password) return res.status(400).json({ msg: 'Faltan datos' });

    const existe = await Usuario.findOne({ email });
    if (existe) return res.status(409).json({ msg: 'Email ya registrado' });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const usuario = new Usuario({ nombre, email, password: hash, rol: rol || 'Vendedor' });
    await usuario.save();

    res.status(201).json({ msg: 'Usuario creado', usuario: { id: usuario._id, email: usuario.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error al crear usuario' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ msg: 'Faltan datos' });

    const usuario = await Usuario.findOne({ email });
    if (!usuario) return res.status(404).json({ msg: 'Usuario no encontrado' });

    const match = await bcrypt.compare(password, usuario.password);
    if (!match) return res.status(401).json({ msg: 'Credenciales inválidas' });

    const payload = { id: usuario._id, rol: usuario.rol };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret_dev', { expiresIn: '8h' });

    res.status(200).json({ token, usuario: { id: usuario._id, nombre: usuario.nombre, rol: usuario.rol } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error en login' });
  }
};

module.exports = { registrar, login };
