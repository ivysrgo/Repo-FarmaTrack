/**
 * src/middlewares/auth.js
 *
 * Middlewares de autenticacion para Express.
 *
 *   - injectUser:  copia req.session.usuario a res.locals.currentUser para
 *                  que las vistas EJS puedan referenciar al usuario logueado.
 *                  No bloquea nada - solo inyecta.
 *   - requireAuth: redirige a /auth/login si no hay usuario en sesion.
 *                  Antes de redirigir, emite un flash 'error' explicando que
 *                  hace falta iniciar sesion.
 *
 * Estos dos middlewares se usan desde routes/index.js para proteger las
 * rutas que solo deben ver usuarios autenticados.
 */
'use strict';

function injectUser(req, res, next) {
  res.locals.currentUser = (req.session && req.session.usuario) || null;
  next();
}

function requireAuth(req, res, next) {
  if (req.session && req.session.usuario) {
    res.locals.currentUser = req.session.usuario;
    return next();
  }
  if (req.flash) req.flash('error', 'Debes iniciar sesion para acceder a esa pagina.');
  return res.redirect('/auth/login');
}

module.exports = { injectUser, requireAuth };
