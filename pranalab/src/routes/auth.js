'use strict';
const express           = require('express');
const router            = express.Router();
const UsuarioRepository = require('../repositories/UsuarioRepository');
const AuthService       = require('../service/AuthService');
const AuthController    = require('../controllers/AuthController');

const usuarioRepo = new UsuarioRepository();
const authSvc     = new AuthService(usuarioRepo);
const authCtrl    = new AuthController(authSvc);

router.get('/login',   authCtrl.showLogin);
router.post('/login',  authCtrl.login);
router.post('/signup', authCtrl.signup);
router.post('/logout', authCtrl.logout);

// Recuperar contraseña (demo)
router.get('/recuperar', (req, res) => {
  res.render('auth/recuperar', {
    layout: 'layouts/auth', title: 'Recuperar contraseña',
    error: req.flash('error'), ok: req.flash('ok'), emailVal: '',
  });
});
router.post('/recuperar', (req, res) => {
  const { email } = req.body;
  if (!email || !email.trim()) {
    req.flash('error', 'Ingresa tu correo institucional.');
    return res.redirect('/auth/recuperar');
  }
  req.flash('ok', `Si el correo ${email} está registrado, recibirás las instrucciones.`);
  res.redirect('/auth/recuperar');
});

module.exports = router;
