/**
 * src/models/Lote.js
 *
 * Modelo Mongoose para Lotes / Ordenes de Produccion.
 *
 * Mantiene los mismos campos que usaba el LoteRepository en memoria, pero
 * agrega:
 *   - Validacion declarativa (enums, required, min)
 *   - Indices (numeroLote unico, busquedas por estado)
 *   - createdAt / updatedAt automaticos via { timestamps: true }
 *
 * Cuando el LoteRepositoryMongo llame .find() / .create() recibira y
 * persistira objetos con esta forma.
 */
'use strict';

const mongoose = require('mongoose');

const ESTADOS_LOTE = [
  'en_espera',
  'en_produccion',
  'pendiente_firma',
  'en_calidad',
  'alerta_bpm',
  'bloqueado',
  'liberado',
  'rechazado',
];

const LoteSchema = new mongoose.Schema({
  // Identificadores
  numeroOrden:         { type: String, required: true, trim: true, index: true },
  numeroLote:          { type: String, required: true, trim: true, unique: true, index: true },

  // Producto
  producto:            { type: String, required: true, trim: true },
  formulaId:           { type: String, default: '', trim: true, index: true },  // clave de src/data/formulas.js
  formaFarmaceutica:   { type: String, default: '', trim: true },
  concentracion:       { type: String, default: '', trim: true },

  // Cantidades
  cantidadPlanificada: { type: Number, required: true, min: 0 },

  // Fechas
  fechaInicio:         { type: Date, required: true },
  fechaFin:            { type: Date, default: null },

  // Estado del flujo
  estado:              { type: String, enum: ESTADOS_LOTE, default: 'en_espera', index: true },
  pasoActual:          { type: Number, default: 1, min: 1, max: 9 },

  // Asignacion
  operario:            { type: String, default: '', trim: true, index: true },
  jefeCalidad:         { type: String, default: '', trim: true },
  directorTecnico:     { type: String, default: 'Director Tecnico', trim: true },
  area:                { type: String, default: '', trim: true },

  // Observaciones y firma
  observaciones:       { type: String, default: '' },
  liberadoPor:         { type: String, default: null },
  liberadoEn:          { type: Date, default: null },

  // Tiempos de presentacion
  tiempoTranscurrido:  { type: String, default: '0m' },

  // Datos del stepper llenados por el operario: { '1': {...}, '2': {...}, ... }
  pasos: { type: mongoose.Schema.Types.Mixed, default: {} },
}, {
  timestamps: true,           // createdAt, updatedAt automaticos
  versionKey: false,          // sin __v
  collection: 'lotes',
});

// Virtuals para mantener compatibilidad con la vista (que espera estadoLabel,
// medicamento, operarioIniciales). Los virtuals NO se persisten pero se
// incluyen al hacer toJSON / toObject.
const LABELS = {
  en_espera: 'En espera', en_produccion: 'En produccion',
  pendiente_firma: 'Pendiente verif.', en_calidad: 'En calidad',
  alerta_bpm: 'Alerta BPM', bloqueado: 'Bloqueado',
  liberado: 'Liberado', rechazado: 'Rechazado',
};

LoteSchema.virtual('estadoLabel').get(function() {
  return LABELS[this.estado] || this.estado;
});

LoteSchema.virtual('medicamento').get(function() {
  return this.producto;
});

LoteSchema.virtual('operarioIniciales').get(function() {
  if (!this.operario) return '';
  return this.operario.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase();
});

LoteSchema.virtual('operarioInicial').get(function() {
  return this.operarioIniciales;
});

LoteSchema.set('toJSON',   { virtuals: true });
LoteSchema.set('toObject', { virtuals: true });

module.exports = mongoose.models.Lote || mongoose.model('Lote', LoteSchema);
module.exports.ESTADOS_LOTE = ESTADOS_LOTE;
module.exports.LABELS = LABELS;
