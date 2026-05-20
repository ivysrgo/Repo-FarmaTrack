/**
 * src/middlewares/auth.js
 * Middleware de protección de rutas.
 * Principio SRP: solo verifica si hay sesión activa.
 */
'use strict';

/**
 * requireAuth — protege rutas que requieren sesión iniciada.
 * Si no hay sesión, redirige al login.
 */
function requireAuth(req, res, next) {
  if (req.session && req.session.usuario) {
    // Inyectar usuario en res.locals para que las vistas lo accedan
    res.locals.currentUser = req.session.usuario;
    return next();
  }
  res.redirect('/auth/login');
}

/**
 * injectUser — inyecta el usuario en locals sin bloquear la ruta.
 * Útil para vistas que muestran el nombre del usuario si está logueado.
 */
function injectUser(req, res, next) {
  res.locals.currentUser = req.session && req.session.usuario
    ? req.session.usuario
    : null;
  next();
}

module.exports = { requireAuth, injectUser };
