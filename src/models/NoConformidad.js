/**
 * src/models/NoConformidad.js
 *
 * Modelo Mongoose para No Conformidades (NC). Cada NC reportada queda
 * registrada como un documento propio (no solo cambia el estado del lote).
 *
 * Permite ver el historial de NCs, filtrar por tipo/severidad, contar abiertas
 * vs resueltas, y asociarlas a un lote.
 */
'use strict';

const mongoose = require('mongoose');

const TIPOS_NC = ['desviacion_bpm', 'material_no_conforme', 'equipo_falla', 'error_proceso', 'documentacion', 'otro'];
const IMPACTOS = ['bajo', 'medio', 'alto', 'critico'];

const NCSchema = new mongoose.Schema({
  tipo:           { type: String, enum: TIPOS_NC, required: true, index: true },
  descripcion:    { type: String, required: true, trim: true },
  impacto:        { type: String, enum: IMPACTOS, default: 'medio' },
  bloqueante:     { type: Boolean, default: false, index: true },
  loteId:         { type: mongoose.Schema.Types.ObjectId, ref: 'Lote', default: null, index: true },
  loteNumero:     { type: String, default: '' },
  pasoLote:       { type: Number, min: 1, max: 9, default: null },   // paso donde ocurrió
  reportadoPor:   { type: String, default: '' },
  resuelta:       { type: Boolean, default: false, index: true },
  resueltaPor:    { type: String, default: null },
  resueltaEn:     { type: Date, default: null },
}, {
  timestamps: true,
  versionKey: false,
  collection: 'no_conformidades',
});

module.exports = mongoose.models.NoConformidad || mongoose.model('NoConformidad', NCSchema);
module.exports.TIPOS_NC = TIPOS_NC;
module.exports.IMPACTOS = IMPACTOS;
