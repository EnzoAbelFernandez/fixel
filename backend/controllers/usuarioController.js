const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');

const crearUsuario = async (req, res) => {
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

const listarUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.find().select('-password').sort({ nombre: 1 });
    res.status(200).json(usuarios);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error al listar usuarios' });
  }
};

const actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    if (updates.password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(updates.password, salt);
    }
    const usuario = await Usuario.findByIdAndUpdate(id, updates, { new: true }).select('-password');
    if (!usuario) return res.status(404).json({ msg: 'Usuario no encontrado' });
    res.status(200).json({ msg: 'Usuario actualizado', usuario });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error al actualizar usuario' });
  }
};

const eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await Usuario.findByIdAndDelete(id);
    if (!usuario) return res.status(404).json({ msg: 'Usuario no encontrado' });
    res.status(200).json({ msg: 'Usuario eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error al eliminar usuario' });
  }
};

module.exports = { crearUsuario, listarUsuarios, actualizarUsuario, eliminarUsuario };
