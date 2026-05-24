/**
 * src/repositories/LoteRepositoryMongo.js
 *
 * Repositorio de lotes contra MongoDB Atlas. Misma interfaz que el repo de
 * memoria pero async.
 *
 * NOTA - normalizacion del id: Mongoose entrega documentos con `_id`
 * (ObjectId). Las vistas EJS usan `lote.id` (string). Aunque exista un
 * virtual `id` en el schema, lean() no siempre lo expone. Para evitar el bug
 * "Ver detalle no hace nada" (href se vuelve "/lotes/" cuando id es undefined),
 * normalizamos a string en cada salida con `_attachId()`.
 */
'use strict';

const Lote = require('../models/Lote');

function _attachId(doc) {
  if (!doc) return doc;
  if (doc._id && !doc.id) doc.id = doc._id.toString();
  return doc;
}

class LoteRepositoryMongo {
  async findAll(filtros = {}) {
    const query = {};
    if (filtros.estado) query.estado = filtros.estado;
    if (filtros.q) {
      const rx = new RegExp(filtros.q, 'i');
      query.$or = [
        { numeroLote:  rx },
        { numeroOrden: rx },
        { producto:    rx },
        { operario:    rx },
      ];
    }
    const docs = await Lote.find(query).sort({ createdAt: -1 }).lean({ virtuals: true });
    return docs.map(_attachId);
  }

  async findById(id) {
    if (!id) return null;
    if (!/^[a-f0-9]{24}$/i.test(String(id))) return null;
    const doc = await Lote.findById(id).lean({ virtuals: true });
    return _attachId(doc);
  }

  async create(data) {
    const payload = { ...data };
    if (!payload.numeroLote) payload.numeroLote = await this.generateNumeroLote();
    const doc = await Lote.create(payload);
    return _attachId(doc.toObject({ virtuals: true }));
  }

  async update(id, partial) {
    if (!/^[a-f0-9]{24}$/i.test(String(id))) return null;
    const doc = await Lote.findByIdAndUpdate(id, partial, { new: true, runValidators: true });
    return doc ? _attachId(doc.toObject({ virtuals: true })) : null;
  }

  async stats() {
    const [total, enProduccion, pendientesFirma, alertasBPM, enCalidad, liberados, bloqueados] = await Promise.all([
      Lote.countDocuments({}),
      Lote.countDocuments({ estado: 'en_produccion' }),
      Lote.countDocuments({ estado: 'pendiente_firma' }),
      Lote.countDocuments({ estado: 'alerta_bpm' }),
      Lote.countDocuments({ estado: 'en_calidad' }),
      Lote.countDocuments({ estado: 'liberado' }),
      Lote.countDocuments({ estado: 'bloqueado' }),
    ]);
    return { total, enProduccion, pendientesFirma, alertasBPM, enCalidad, liberados, bloqueados };
  }

  async generateNumeroLote() {
    const year = new Date().getFullYear();
    const prefix = `FT-${year}-`;
    const ultimo = await Lote.findOne({ numeroLote: new RegExp('^' + prefix) })
      .sort({ numeroLote: -1 }).select('numeroLote').lean();
    let seq = 1;
    if (ultimo && ultimo.numeroLote) {
      const m = ultimo.numeroLote.match(/-(\d+)$/);
      if (m) seq = parseInt(m[1], 10) + 1;
    }
    return `${prefix}${String(seq).padStart(4, '0')}`;
  }
}

module.exports = new LoteRepositoryMongo();
module.exports.LoteRepositoryMongo = LoteRepositoryMongo;
