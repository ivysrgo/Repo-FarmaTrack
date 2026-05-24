/**
 * src/controllers/AuthController.js
 *
 * Controlador HTTP del flujo de autenticacion. AuthService es async ahora.
 */
'use strict';

const authService = require('../service/AuthService');

function showLogin(req, res) {
  if (req.session && req.session.usuario) return res.redirect('/bienvenida');
  res.render('auth/login', {
    layout:      'layouts/auth',
    title:       'Acceso - FarmaTrack',
    error:       req.flash('error'),
    email:       req.flash('email'),
    signupError: req.flash('signupError'),
  });
}

async function login(req, res) {
  const { email, password } = req.body || {};
  const result = await authService.login(email, password);

  if (!result.ok) {
    req.flash('error', result.error);
    req.flash('email', email || '');
    return res.redirect('/auth/login');
  }

  req.session.regenerate(() => {
    req.session.usuario = result.user;
    res.redirect('/bienvenida');
  });
}

function signup(req, res) {
  req.flash('signupError', 'Por ahora el registro esta deshabilitado. Usa una cuenta demo.');
  res.redirect('/auth/login?tab=signup');
}

function logout(req, res) {
  req.session.destroy(() => res.redirect('/auth/login'));
}

module.exports = { showLogin, login, signup, logout };
