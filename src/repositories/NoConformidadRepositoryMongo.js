'use strict';
const NoConformidad = require('../models/NoConformidad');

function _attachId(doc) {
  if (!doc) return doc;
  if (doc._id && !doc.id) doc.id = doc._id.toString();
  return doc;
}

class NoConformidadRepositoryMongo {
  async findAll(filtros = {}) {
    const q = {};
    if (filtros.tipo)        q.tipo = filtros.tipo;
    if (filtros.loteId)      q.loteId = filtros.loteId;
    if (filtros.bloqueante !== undefined) q.bloqueante = filtros.bloqueante;
    if (filtros.resuelta !== undefined)   q.resuelta = filtros.resuelta;
    const docs = await NoConformidad.find(q).sort({ createdAt: -1 }).lean();
    return docs.map(_attachId);
  }
  async findById(id) {
    if (!id || !/^[a-f0-9]{24}$/i.test(String(id))) return null;
    const d = await NoConformidad.findById(id).lean();
    return _attachId(d);
  }
  async create(data) {
    const doc = await NoConformidad.create(data);
    return _attachId(doc.toObject());
  }
  async stats() {
    const [total, abiertas, bloqueantes] = await Promise.all([
      NoConformidad.countDocuments({}),
      NoConformidad.countDocuments({ resuelta: false }),
      NoConformidad.countDocuments({ bloqueante: true, resuelta: false }),
    ]);
    return { total, abiertas, bloqueantes };
  }

  async resolver(id, resueltaPor = '') {
    if (!id || !/^[a-f0-9]{24}$/i.test(String(id))) return null;
    const doc = await NoConformidad.findByIdAndUpdate(id, {
      resuelta: true, resueltaPor, resueltaEn: new Date(),
    }, { new: true });
    return doc ? _attachId(doc.toObject()) : null;
  }
}
module.exports = new NoConformidadRepositoryMongo();
module.exports.NoConformidadRepositoryMongo = NoConformidadRepositoryMongo;
