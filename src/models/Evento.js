/**
 * src/models/Evento.js
 *
 * Modelo de eventos del sistema (bitácora). Cada acción importante
 * genera un evento que queda registrado para auditoría/INVIMA.
 *
 * Tipos de eventos:
 *   - lote_creado
 *   - paso_completado
 *   - lote_pendiente_firma  (operario notifica al DT en paso 9)
 *   - lote_liberado          (DT firma)
 *   - nc_reportada
 *   - lote_alerta_bpm
 */
'use strict';

const mongoose = require('mongoose');

const TIPOS_EVENTO = [
  'lote_creado',
  'paso_completado',
  'lote_pendiente_firma',
  'lote_liberado',
  'nc_reportada',
  'lote_alerta_bpm',
];

const EventoSchema = new mongoose.Schema({
  tipo:       { type: String, enum: TIPOS_EVENTO, required: true, index: true },
  texto:      { type: String, required: true },
  usuario:    { type: String, default: 'Sistema' },
  loteId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Lote', default: null, index: true },
  loteNumero: { type: String, default: '' },
  meta:       { type: mongoose.Schema.Types.Mixed, default: {} },   // extras (paso, severidad, etc)
}, {
  timestamps: true,
  versionKey: false,
  collection: 'eventos',
});

EventoSchema.index({ createdAt: -1 });

module.exports = mongoose.models.Evento || mongoose.model('Evento', EventoSchema);
module.exports.TIPOS_EVENTO = TIPOS_EVENTO;
