/**
 * src/models/Usuario.js
 * Modelo de dominio para el usuario del sistema.
 * Principio SRP: solo representa la entidad Usuario.
 */
'use strict';

class Usuario {
  constructor(data = {}) {
    this.id       = data.id       || null;
    this.nombre   = data.nombre   || '';
    this.email    = data.email    || '';
    this.password = data.password || '';
    this.rol      = data.rol      || 'operario';
    this.cargo    = data.cargo    || '';
    this.activo   = data.activo   !== undefined ? data.activo : true;
  }

  /**
   * Verifica la contraseña (texto plano para demo).
   * En producción: bcrypt.compare(password, this.password)
   */
  verificarPassword(password) {
    return this.password === password;
  }

  /**
   * Devuelve objeto seguro sin la contraseña (para guardar en sesión).
   */
  toSession() {
    return {
      id:     this.id,
      nombre: this.nombre,
      email:  this.email,
      rol:    this.rol,
      cargo:  this.cargo,
    };
  }

  static fromDB(data) {
    return new Usuario(data);
  }
}

module.exports = Usuario;
