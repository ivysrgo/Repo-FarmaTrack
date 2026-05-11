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
<<<<<<< HEAD
    if (req.session && req.session.usuario) return res.redirect('/panel');
=======
    if (req.session && req.session.usuario) return res.redirect('/bienvenida');
>>>>>>> d51e171 (CAmbios y Funcionalidades realizadas para FarmaTrack)
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
<<<<<<< HEAD
        res.redirect('/panel');
=======
        // Tras autenticarse, mostrar la vista de bienvenida antes del panel.
        res.redirect('/bienvenida');
>>>>>>> d51e171 (CAmbios y Funcionalidades realizadas para FarmaTrack)
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
<<<<<<< HEAD
        res.redirect('/panel');
=======
        // Tras registrarse, también pasamos por la vista de bienvenida.
        res.redirect('/bienvenida');
>>>>>>> d51e171 (CAmbios y Funcionalidades realizadas para FarmaTrack)
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
