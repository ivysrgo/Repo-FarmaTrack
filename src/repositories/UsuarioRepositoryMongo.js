/**
 * src/repositories/UsuarioRepositoryMongo.js
 *
 * Repositorio de Usuarios contra MongoDB. Esta es la pieza que AuthService
 * va a consumir cuando migremos a async: el service se mantiene igual, solo
 * cambia donde viven los usuarios.
 *
 * Interfaz publica (todos async):
 *   findByEmail(email) -> Promise<UsuarioDoc | null>
 *   findById(id)       -> Promise<UsuarioDoc | null>
 *   create(data)       -> Promise<UsuarioDoc>
 *   countAll()         -> Promise<number>   (util para seed idempotente)
 */
'use strict';

const Usuario = require('../models/Usuario');

class UsuarioRepositoryMongo {
  async findByEmail(email) {
    if (!email || typeof email !== 'string') return null;
    return Usuario.findOne({ email: email.toLowerCase().trim() });
  }

  async findById(id) {
    if (!id || !/^[a-f0-9]{24}$/i.test(String(id))) return null;
    return Usuario.findById(id);
  }

  async findByRol(rol) {
    if (!rol) return [];
    return Usuario.find({ rol, activo: { $ne: false } }).lean();
  }

  async findAll() {
    return Usuario.find({}).lean();
  }

  async create(data) {
    return Usuario.create(data);
  }

  async countAll() {
    return Usuario.countDocuments({});
  }

  /**
   * Marca el timestamp de "última sesión" en el usuario y devuelve el valor
   * ANTERIOR (lo que necesita la bienvenida para mostrar "Última sesión: X").
   */
  async touchLastLogin(id) {
    if (!id || !/^[a-f0-9]{24}$/i.test(String(id))) return null;
    const u = await Usuario.findById(id);
    if (!u) return null;
    const prev = u.ultimaSesion ? new Date(u.ultimaSesion) : null;
    u.ultimaSesion = new Date();
    await u.save();
    return prev;
  }
}

module.exports = new UsuarioRepositoryMongo();
module.exports.UsuarioRepositoryMongo = UsuarioRepositoryMongo;
