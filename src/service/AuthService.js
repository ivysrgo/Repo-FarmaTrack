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

  /**
   * Registra un usuario nuevo. Valida campos, normaliza email, chequea duplicado,
   * persiste en el repo (memoria o Mongo) y devuelve el usuario saneado.
   * Cargo se infiere del rol si no llega explícito.
   * @returns {Promise<{ok:true, user}> | {ok:false, error, code}>}
   */
  async registrar({ nombre, email, password, confirmPassword, rol, terminos } = {}) {
    const errores = [];
    const _email = (email || '').toString().toLowerCase().trim();
    const _nombre = (nombre || '').toString().trim();
    const _password = (password || '').toString();

    if (!_nombre || _nombre.length < 2) errores.push('Ingresa tu nombre completo (mínimo 2 caracteres).');
    if (!_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(_email)) errores.push('Ingresa un correo electrónico válido.');
    if (_email && !_email.endsWith('@farmatrack.co'))            errores.push('El correo debe ser del dominio @farmatrack.co.');
    if (!_password || _password.length < 4) errores.push('La contraseña debe tener mínimo 4 caracteres.');
    if (_password !== (confirmPassword || '').toString()) errores.push('Las contraseñas no coinciden.');
    const ROLES_OK = ['operario', 'director_tecnico'];
    if (!rol || !ROLES_OK.includes(rol)) errores.push('Selecciona un rol válido (operario o director técnico).');
    if (!terminos) errores.push('Debes aceptar los términos del sistema BPM.');
    if (errores.length > 0) return { ok: false, error: errores.join(' · '), code: 'VALIDATION' };

    // Duplicado por email
    const ya = await this.usuarioRepo.findByEmail(_email);
    if (ya) return { ok: false, error: 'Ya existe una cuenta con ese correo.', code: 'DUPLICATE_EMAIL' };

    const CARGOS = {
      operario:         'Operario de Produccion',
      calidad:          'Analista de Calidad',
      director_tecnico: 'Director Tecnico',
    };

    let creado;
    try {
      creado = await this.usuarioRepo.create({
        nombre:   _nombre,
        email:    _email,
        password: _password,
        rol,
        cargo:    CARGOS[rol] || '',
        activo:   true,
      });
    } catch (err) {
      // Mongo unique index puede rebotar igual si hubo race condition
      if (err && err.code === 11000) {
        return { ok: false, error: 'Ya existe una cuenta con ese correo.', code: 'DUPLICATE_EMAIL' };
      }
      console.error('[AuthService.registrar] Error al persistir:', err && err.message);
      return { ok: false, error: 'No se pudo crear la cuenta. Intenta de nuevo.', code: 'PERSIST_ERROR' };
    }

    return { ok: true, user: this.sanitizeUser(creado) };
  }
}

// Singleton conectado al repo del composition root
const { getUsuarioRepo } = require('../repositories');
const instance = new AuthService(getUsuarioRepo());

module.exports = instance;
module.exports.AuthService = AuthService;
