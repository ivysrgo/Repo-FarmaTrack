/**
 * src/service/AuthService.js
 *
 * Servicio de autenticacion - logica de negocio pura, async, sin HTTP.
 *
 * Recibe un `usuarioRepo` por constructor (no un store crudo). El repo expone
 * findByEmail(email) que devuelve una Promise<usuario|null>. Hoy ese repo
 * puede ser el de memoria (UsuarioRepository) o el de Mongo
 * (UsuarioRepositoryMongo) - el service no se entera.
 */
'use strict';

class AuthService {
  constructor(usuarioRepo) {
    if (!usuarioRepo || typeof usuarioRepo.findByEmail !== 'function') {
      throw new Error('AuthService requiere un usuarioRepo con findByEmail()');
    }
    this.usuarioRepo = usuarioRepo;
  }

  async findUserByEmail(email) {
    return this.usuarioRepo.findByEmail(email);
  }

  /**
   * Devuelve la copia segura del usuario para guardar en req.session.
   * Acepta tanto un POJO como un documento Mongoose (que tiene .toSession()).
   */
  sanitizeUser(u) {
    if (!u) return null;
    if (typeof u.toSession === 'function') return u.toSession();
    return {
      id:     u.id || (u._id && u._id.toString()),
      nombre: u.nombre,
      email:  u.email,
      rol:    u.rol,
      cargo:  u.cargo,
    };
  }

  /**
   * Intenta autenticar al usuario.
   * @returns {Promise<{ok: true, user: object} | {ok: false, error, code}>}
   */
  async login(email, password) {
    if (!email || !password) {
      return { ok: false, error: 'Correo y contrasena son requeridos.', code: 'MISSING_FIELDS' };
    }
    const user = await this.usuarioRepo.findByEmail(email);
    if (!user || user.password !== password) {
      return { ok: false, error: 'Correo o contrasena incorrectos.', code: 'INVALID_CREDENTIALS' };
    }
    if (!user.activo) {
      return { ok: false, error: 'La cuenta esta inactiva. Contacta al administrador.', code: 'INACTIVE' };
    }

    // Login OK - capturamos el valor anterior de ultimaSesion ANTES de pisarlo,
    // y lo metemos en el payload de sesion para que la bienvenida lo muestre.
    let ultimaSesionPrev = null;
    if (typeof this.usuarioRepo.touchLastLogin === 'function') {
      const userId = user.id || (user._id && user._id.toString());
      ultimaSesionPrev = await this.usuarioRepo.touchLastLogin(userId);
    }
    const sessionUser = this.sanitizeUser(user);
    sessionUser.ultimaSesion = ultimaSesionPrev ? ultimaSesionPrev.toISOString() : null;
    return { ok: true, user: sessionUser };
  }
}

// Singleton conectado al repo del composition root
const { getUsuarioRepo } = require('../repositories');
const instance = new AuthService(getUsuarioRepo());

module.exports = instance;
module.exports.AuthService = AuthService;
