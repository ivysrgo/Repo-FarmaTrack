/**
 * src/models/Usuario.js
 *
 * Modelo Mongoose para Usuarios del sistema.
 *
 * IMPORTANTE - PASSWORDS: en demo guardamos en texto plano para que el seed
 * y el login funcionen sin friccion. En produccion se debe usar bcrypt.hash
 * antes de guardar y bcrypt.compare al validar (eso vive en AuthService.login,
 * no en el modelo).
 */
'use strict';

const mongoose = require('mongoose');

const ROLES = ['director_tecnico', 'operario', 'calidad', 'admin'];

const UsuarioSchema = new mongoose.Schema({
  nombre:   { type: String, required: true, trim: true },
  email:    { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
  password: { type: String, required: true },     // demo: texto plano
  rol:      { type: String, enum: ROLES, default: 'operario', index: true },
  cargo:    { type: String, default: '' },
  activo:   { type: Boolean, default: true },
  ultimaSesion: { type: Date, default: null },   // timestamp del último login exitoso
}, {
  timestamps: true,
  versionKey: false,
  collection: 'usuarios',
});

// Helper: copia segura del usuario (sin password ni flags internos) para guardar
// en req.session. AuthService usa esto.
UsuarioSchema.methods.toSession = function() {
  return {
    id:           this._id.toString(),
    nombre:       this.nombre,
    email:        this.email,
    rol:          this.rol,
    cargo:        this.cargo,
    ultimaSesion: this.ultimaSesion || null,
  };
};

module.exports = mongoose.models.Usuario || mongoose.model('Usuario', UsuarioSchema);
module.exports.ROLES = ROLES;
