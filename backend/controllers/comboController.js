const Combo = require('../models/Combo');

const crearCombo = async (req, res) => {
  try {
    const { nombre, items, precioVenta } = req.body;
    if (!nombre || !Array.isArray(items) || items.length === 0 || precioVenta == null) {
      return res.status(400).json({ msg: 'Nombre, items y precioVenta son requeridos' });
    }
    const combo = new Combo({ nombre, items, precioVenta });
    await combo.save();
    res.status(201).json({ msg: 'Combo creado', combo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error al crear combo' });
  }
};

const obtenerCombos = async (req, res) => {
  try {
    const combos = await Combo.find().populate('items.producto').sort({ nombre: 1 });
    res.status(200).json(combos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error al obtener combos' });
  }
};

const editarCombo = async (req, res) => {
  try {
    const { id } = req.params;
    const combo = await Combo.findByIdAndUpdate(id, req.body, { new: true });
    if (!combo) return res.status(404).json({ msg: 'Combo no encontrado' });
    res.status(200).json({ msg: 'Combo actualizado', combo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error al actualizar combo' });
  }
};

const eliminarCombo = async (req, res) => {
  try {
    const { id } = req.params;
    const combo = await Combo.findByIdAndDelete(id);
    if (!combo) return res.status(404).json({ msg: 'Combo no encontrado' });
    res.status(200).json({ msg: 'Combo eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error al eliminar combo' });
  }
};

module.exports = { crearCombo, obtenerCombos, editarCombo, eliminarCombo };
