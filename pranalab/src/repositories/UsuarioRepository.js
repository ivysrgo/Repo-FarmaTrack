/**
 * src/repositories/UsuarioRepository.js
 * Repositorio en memoria para usuarios.
 * Principio OCP: reemplazable por BD real sin tocar el resto.
 */
'use strict';

const Usuario = require('../models/Usuario');
const db      = require('../../config/database');

class UsuarioRepository {
  constructor() { this._store = db.usuarios; }

  findByEmail(email) {
    const data = this._store.find(
      u => u.email.toLowerCase() === email.toLowerCase()
    );
    return data ? Usuario.fromDB(data) : null;
  }

  findById(id) {
    const data = this._store.find(u => u.id === id);
    return data ? Usuario.fromDB(data) : null;
  }

  /* Crea un usuario nuevo en el store en memoria */
  create(data) {
    const usuario = new Usuario(data);
    this._store.push(usuario);     // guarda el objeto directamente
    return usuario;
  }
}

module.exports = UsuarioRepository;
