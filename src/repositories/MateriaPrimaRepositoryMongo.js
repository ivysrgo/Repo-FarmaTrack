/**
 * src/repositories/MateriaPrimaRepositoryMongo.js
 */
'use strict';
const MateriaPrima = require('../models/MateriaPrima');

function _estadoDesdeStock(stockKg, stockMinKg) {
  if (stockKg <= 0) return 'agotado';
  if (stockKg < stockMinKg) return 'bajo';
  return 'ok';
}

function _attachId(doc) {
  if (!doc) return doc;
  if (doc._id && !doc.id) doc.id = doc._id.toString();
  doc.estado = _estadoDesdeStock(doc.stockKg, doc.stockMinKg);
  return doc;
}

class MateriaPrimaRepositoryMongo {
  async findAll() {
    const docs = await MateriaPrima.find({}).sort({ codigo: 1 }).lean();
    return docs.map(_attachId);
  }
  async findByCodigo(codigo) {
    const doc = await MateriaPrima.findOne({ codigo }).lean();
    return doc ? _attachId(doc) : null;
  }
  async create(data) {
    const doc = await MateriaPrima.create(data);
    return _attachId(doc.toObject());
  }
  async stats() {
    const all = await this.findAll();
    return {
      total:    all.length,
      bajos:    all.filter(m => m.estado === 'bajo').length,
      agotados: all.filter(m => m.estado === 'agotado').length,
    };
  }
}
module.exports = new MateriaPrimaRepositoryMongo();
module.exports.MateriaPrimaRepositoryMongo = MateriaPrimaRepositoryMongo;
