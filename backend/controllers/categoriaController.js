const Categoria = require('../models/Categoria')

exports.list = async (req, res) => {
  const categorias = await Categoria.find().sort('nombre')
  res.json(categorias)
}

exports.create = async (req, res) => {
  try {
    const cat = new Categoria(req.body)
    await cat.save()
    res.status(201).json(cat)
  } catch (e) {
    res.status(400).json({ msg: e.message })
  }
}

exports.update = async (req, res) => {
  try {
    const cat = await Categoria.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!cat) return res.status(404).json({ msg: 'No encontrada' })
    res.json(cat)
  } catch (e) {
    res.status(400).json({ msg: e.message })
  }
}

exports.delete = async (req, res) => {
  try {
    const cat = await Categoria.findByIdAndDelete(req.params.id)
    if (!cat) return res.status(404).json({ msg: 'No encontrada' })
    res.json({ ok: true })
  } catch (e) {
    res.status(400).json({ msg: e.message })
  }
}
