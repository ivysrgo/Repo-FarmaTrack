/**
 * src/services/AuthService.js
 * Lógica de negocio de autenticación y registro.
 * Principio SRP: solo maneja reglas de auth.
 * Principio DIP: depende de abstracción UsuarioRepository.
 */
'use strict';

const AppError = require('../utils/AppError');
const { v4: uuidv4 } = require('uuid');

class AuthService {
  constructor(usuarioRepository) {
    this._repo = usuarioRepository;
  }

  /* ── Login ───────────────────────────────────────────────── */
  login(email, password) {
    if (!email || !email.trim())
      throw new AppError('El correo es requerido.', 400);
    if (!password)
      throw new AppError('La contraseña es requerida.', 400);

    const usuario = this._repo.findByEmail(email.trim());
    if (!usuario)
      throw new AppError('Credenciales incorrectas.', 401);
    if (!usuario.activo)
      throw new AppError('Tu cuenta está desactivada. Contacta al administrador.', 403);
    if (!usuario.verificarPassword(password))
      throw new AppError('Credenciales incorrectas.', 401);

    return usuario.toSession();
  }

  /* ── Signup ──────────────────────────────────────────────── */
  signup({ nombre, email, password, confirmPassword, rol, cargo }) {
    // Validaciones de campos requeridos
    if (!nombre || !nombre.trim())
      throw new AppError('El nombre completo es requerido.', 400);
    if (!email || !email.trim())
      throw new AppError('El correo es requerido.', 400);
    if (!password)
      throw new AppError('La contraseña es requerida.', 400);
    if (password.length < 4)
      throw new AppError('La contraseña debe tener mínimo 4 caracteres.', 400);
    if (password !== confirmPassword)
      throw new AppError('Las contraseñas no coinciden.', 400);
    if (!rol)
      throw new AppError('Selecciona un rol.', 400);

    // Email ya registrado
    const existe = this._repo.findByEmail(email.trim());
    if (existe)
      throw new AppError('Ya existe una cuenta con ese correo.', 409);

    // Crear usuario en memoria
    const nuevoUsuario = this._repo.create({
      id:       uuidv4(),
      nombre:   nombre.trim(),
      email:    email.trim().toLowerCase(),
      password: password,           // demo: texto plano. Prod: bcrypt.hash()
      rol:      rol,
      cargo:    cargo || rol,
      activo:   true,
    });

    return nuevoUsuario.toSession();
  }
}

module.exports = AuthService;
