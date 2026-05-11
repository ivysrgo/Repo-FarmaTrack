/**
 * src/routes/index.js
 * Router principal — monta todos los módulos.
 *
 * Módulos integrados:
 *  - Auth        (login, signup, logout)     ← loginbahos
 *  - Panel       (dashboard Director Técnico) ← base (DisenoArquitecturaClase)
 *  - Lotes       (tabla de lotes activos)    ← sergio
 *  - No-conformidades                        ← base (DisenoArquitecturaClase)
 */
'use strict';

const express           = require('express');
const router            = express.Router();

const authRouter          = require('./auth');
const panelRouter         = require('./panel');
const lotesRouter         = require('./lotes');
const noConformidadRouter = require('./noConformidad');
<<<<<<< HEAD
=======
const operarioRouter      = require('./operario');
>>>>>>> d51e171 (CAmbios y Funcionalidades realizadas para FarmaTrack)

const { requireAuth, injectUser } = require('../middlewares/auth');

// ── Raíz: redirige según sesión ────────────────────────────────
router.get('/', injectUser, (req, res) => {
<<<<<<< HEAD
  if (res.locals.currentUser) return res.redirect('/panel');
=======
  if (res.locals.currentUser) return res.redirect('/bienvenida');
>>>>>>> d51e171 (CAmbios y Funcionalidades realizadas para FarmaTrack)
  res.redirect('/auth/login');
});

// ── Rutas públicas (no requieren sesión) ───────────────────────
router.use('/auth', authRouter);

// ── Rutas protegidas (requieren sesión) ───────────────────────
router.use('/panel',         requireAuth, panelRouter);
router.use('/lotes',         requireAuth, lotesRouter);
router.use('/noconformidad', requireAuth, noConformidadRouter);
<<<<<<< HEAD

// Bienvenida post-login
=======
router.use('/mis-lotes',     requireAuth, operarioRouter);

// Bienvenida post-login (RQF-04)
// Vista intermedia entre el login y el panel: muestra la tarjeta de bienvenida
// con el rol, correo y hora de inicio de sesión, y ofrece el botón
// "Continuar al panel" para entrar al dashboard del Director Técnico.
>>>>>>> d51e171 (CAmbios y Funcionalidades realizadas para FarmaTrack)
router.get('/bienvenida', requireAuth, (req, res) => {
  res.render('auth/bienvenida', {
    title:  'Bienvenido',
    layout: 'layouts/auth',
  });
});

module.exports = router;
