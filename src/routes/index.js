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

const { requireAuth, injectUser } = require('../middlewares/auth');

// ── Raíz: redirige según sesión ────────────────────────────────
router.get('/', injectUser, (req, res) => {
  if (res.locals.currentUser) return res.redirect('/panel');
  res.redirect('/auth/login');
});

// ── Rutas públicas (no requieren sesión) ───────────────────────
router.use('/auth', authRouter);

// ── Rutas protegidas (requieren sesión) ───────────────────────
router.use('/panel',         requireAuth, panelRouter);
router.use('/lotes',         requireAuth, lotesRouter);
router.use('/noconformidad', requireAuth, noConformidadRouter);

// Bienvenida post-login
router.get('/bienvenida', requireAuth, (req, res) => {
  res.render('auth/bienvenida', {
    title:  'Bienvenido',
    layout: 'layouts/auth',
  });
});

module.exports = router;
