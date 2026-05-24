/**
 * src/repositories/UsuarioRepository.js
 *
 * Repositorio en memoria de Usuarios. Misma interfaz async que
 * UsuarioRepositoryMongo, lee del mock config/database.js.
 */
'use strict';

const db = require('../../config/database');

class UsuarioRepository {
  constructor(store = db) {
    if (!store || !Array.isArray(store.usuarios)) {
      throw new Error('UsuarioRepository requiere un store con `usuarios: []`');
    }
    this.store = store;
  }

  async findByEmail(email) {
    if (!email || typeof email !== 'string') return null;
    const norm = email.toLowerCase().trim();
    return this.store.usuarios.find(u => u.email.toLowerCase() === norm) || null;
  }

  async findById(id) {
    if (!id) return null;
    return this.store.usuarios.find(u => u.id === id) || null;
  }

  async findByRol(rol) {
    if (!rol) return [];
    return this.store.usuarios.filter(u => u.rol === rol && u.activo !== false);
  }

  async findAll() {
    return [...this.store.usuarios];
  }

  async create(data) {
    const nuevo = { id: 'u-' + (this.store.usuarios.length + 1).toString().padStart(3, '0'), ...data };
    this.store.usuarios.push(nuevo);
    return nuevo;
  }

  async countAll() {
    return this.store.usuarios.length;
  }

  /**
   * Marca el timestamp de "última sesión" en el usuario y devuelve el valor
   * ANTERIOR (lo que necesita la bienvenida).
   */
  async touchLastLogin(id) {
    const u = this.store.usuarios.find(x => x.id === id);
    if (!u) return null;
    const prev = u.ultimaSesion ? new Date(u.ultimaSesion) : null;
    u.ultimaSesion = new Date();
    return prev;
  }
}

const instance = new UsuarioRepository();
module.exports = instance;
module.exports.UsuarioRepository = UsuarioRepository;
