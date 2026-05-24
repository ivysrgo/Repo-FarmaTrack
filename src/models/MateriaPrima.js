/**
 * src/models/MateriaPrima.js
 *
 * Modelo Mongoose para Materias Primas (catálogo de inventario).
 *
 * Cada documento es una MP del laboratorio: código único (MP-001…),
 * stock actual en kg y mínimo permitido. El campo `estado` se DERIVA del
 * stock vs stockMin (ok / bajo / agotado) y se calcula en el repositorio
 * antes de devolver al controller — así la vista no tiene que repetir la
 * lógica.
 *
 * En este iteración solo persistimos los datos: el inventario NO se
 * descuenta automáticamente cuando un lote pesa MPs (eso queda fuera de
 * alcance, el DT no maneja inventario activamente).
 */
'use strict';

const mongoose = require('mongoose');

const ESTADOS_MP = ['ok', 'bajo', 'agotado'];

const MateriaPrimaSchema = new mongoose.Schema({
  codigo:     { type: String, required: true, unique: true, index: true, trim: true },
  nombre:     { type: String, required: true, trim: true },
  stockKg:    { type: Number, required: true, default: 0, min: 0 },
  stockMinKg: { type: Number, required: true, default: 0, min: 0 },
  proveedor:  { type: String, default: '', trim: true },
}, {
  timestamps: true,
  versionKey: false,
  collection: 'materias_primas',
});

module.exports = mongoose.models.MateriaPrima || mongoose.model('MateriaPrima', MateriaPrimaSchema);
module.exports.ESTADOS_MP = ESTADOS_MP;
