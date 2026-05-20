/**
 * src/routes/auth.js
 * Rutas de autenticación. Conecta los handlers del AuthController (que ahora
 * son funciones planas, no métodos de instancia — ver la nota en AuthController).
 */
'use strict';

const { Router } = require('express');
const router = Router();

const { showLogin, login, signup, logout } = require('../controllers/AuthController');

router.get ('/login',  showLogin);
router.post('/login',  login);
router.post('/signup', signup);
router.post('/logout', logout);

// Recuperar contraseña — placeholder demo (no envía mail real).
router.get('/recuperar', (req, res) => {
  res.render('auth/recuperar', {
    layout:   'layouts/auth',
    title:    'Recuperar contraseña',
    error:    req.flash('error'),
    ok:       req.flash('ok'),
    emailVal: '',
  });
});
router.post('/recuperar', (req, res) => {
  const { email } = req.body || {};
  if (!email || !email.trim()) {
    req.flash('error', 'Ingresa tu correo institucional.');
    return res.redirect('/auth/recuperar');
  }
  req.flash('ok', `Si el correo ${email} está registrado, recibirás las instrucciones.`);
  res.redirect('/auth/recuperar');
});

module.exports = router;
