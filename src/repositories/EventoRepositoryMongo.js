'use strict';
const Evento = require('../models/Evento');

function _attachId(doc) {
  if (!doc) return doc;
  if (doc._id && !doc.id) doc.id = doc._id.toString();
  return doc;
}

class EventoRepositoryMongo {
  async findAll(filtros = {}) {
    const q = {};
    if (filtros.tipo)    q.tipo = filtros.tipo;
    if (filtros.usuario) q.usuario = filtros.usuario;
    if (filtros.loteId)  q.loteId = filtros.loteId;
    const limit = filtros.limit || 50;
    const docs = await Evento.find(q).sort({ createdAt: -1 }).limit(limit).lean();
    return docs.map(_attachId);
  }
  async create(data) {
    const doc = await Evento.create(data);
    return _attachId(doc.toObject());
  }
  async countAll() { return Evento.countDocuments({}); }
}
module.exports = new EventoRepositoryMongo();
module.exports.EventoRepositoryMongo = EventoRepositoryMongo;
