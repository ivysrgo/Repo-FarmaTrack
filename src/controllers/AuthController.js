/**
 * src/controllers/AuthController.js
 * Controlador MVC — flujo HTTP de login, signup y logout.
 */
'use strict';

class AuthController {
  constructor(authService) {
    this._svc = authService;
    ['showLogin','login','signup','logout'].forEach(m => {
      this[m] = this[m].bind(this);
    });
  }

  /* GET /auth/login */
  showLogin(req, res) {
    if (req.session && req.session.usuario) return res.redirect('/panel');
    res.render('auth/login', {
      layout:      'layouts/auth',
      title:       'Acceso — FarmaTrack',
      error:       req.flash('error'),
      email:       req.flash('email'),
      signupError: req.flash('signupError'),
    });
  }

  /* POST /auth/login */
  login(req, res) {
    const { email, password } = req.body;
    try {
      const usuarioSesion = this._svc.login(email, password);
      req.session.regenerate((err) => {
        req.session.usuario = usuarioSesion;
        res.redirect('/panel');
      });
    } catch (err) {
      req.flash('error', err.message);
      req.flash('email', email || '');
      res.redirect('/auth/login');
    }
  }

  /* POST /auth/signup */
  signup(req, res) {
    try {
      const usuarioSesion = this._svc.signup(req.body);
      req.session.regenerate((err) => {
        req.session.usuario = usuarioSesion;
        res.redirect('/panel');
      });
    } catch (err) {
      req.flash('signupError', err.message);
      res.redirect('/auth/login?tab=signup');
    }
  }

  /* POST /auth/logout */
  logout(req, res) {
    req.session.destroy(() => res.redirect('/auth/login'));
  }
}

module.exports = AuthController;
