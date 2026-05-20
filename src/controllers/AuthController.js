/**
 * src/controllers/AuthController.js
 *
 * Controlador HTTP del flujo de autenticación: login, signup, logout.
 *
 * NOTA SOBRE EL MERGE — En la versión anterior este controlador recibía un
 * `authService` por constructor (patrón de inversión de dependencias). El
 * merge eliminó `src/service/AuthService.js` y `src/repositories/UsuarioRepository.js`,
 * así que ahora el controller valida directamente contra `config/database.js`,
 * que sigue siendo la fuente mock de los 3 usuarios demo (Juan Bahos / Sergio
 * Velandia / David Peña, clave "1234"). Cuando los usuarios vivan en MongoDB,
 * basta con reemplazar `findUserByEmail` por una llamada a User.findOne(...).
 */
'use strict';

const db = require('../../config/database');

// ── Acceso al "almacén" de usuarios (mock por ahora) ─────────────
function findUserByEmail(email) {
  if (!email) return null;
  return db.usuarios.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
}

function sanitizeUser(u) {
  // No exponemos password ni campos internos en la sesión
  return {
    id:     u.id,
    nombre: u.nombre,
    email:  u.email,
    rol:    u.rol,
    cargo:  u.cargo,
  };
}

// ── Handlers ─────────────────────────────────────────────────────

/** GET /auth/login */
function showLogin(req, res) {
  if (req.session && req.session.usuario) return res.redirect('/bienvenida');
  res.render('auth/login', {
    layout:      'layouts/auth',
    title:       'Acceso — FarmaTrack',
    error:       req.flash('error'),
    email:       req.flash('email'),
    signupError: req.flash('signupError'),
  });
}

/** POST /auth/login */
function login(req, res) {
  const { email, password } = req.body || {};
  const user = findUserByEmail(email);

  if (!user || user.password !== password || !user.activo) {
    req.flash('error', 'Correo o contraseña incorrectos.');
    req.flash('email', email || '');
    return res.redirect('/auth/login');
  }

  req.session.regenerate(() => {
    req.session.usuario = sanitizeUser(user);
    // Después del login pasamos por la vista de bienvenida (RQF-04).
    res.redirect('/bienvenida');
  });
}

/**
 * POST /auth/signup
 *
 * Implementación demo: por ahora rechazamos el signup porque los 3 usuarios
 * vienen pre-cargados desde `config/database.js`. Cuando los usuarios vivan
 * en MongoDB se reemplaza este body por un insert real.
 */
function signup(req, res) {
  req.flash('signupError', 'Por ahora el registro está deshabilitado. Usa una cuenta demo.');
  res.redirect('/auth/login?tab=signup');
}

/** POST /auth/logout */
function logout(req, res) {
  req.session.destroy(() => res.redirect('/auth/login'));
}

module.exports = {
  showLogin,
  login,
  signup,
  logout,
};
