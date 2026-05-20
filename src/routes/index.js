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
const operarioRouter      = require('./operario');
const sidebarRouter       = require('./sidebar');

const { requireAuth, injectUser } = require('../middlewares/auth');

// ── Raíz: redirige según sesión ────────────────────────────────
router.get('/', injectUser, (req, res) => {
  if (res.locals.currentUser) return res.redirect('/bienvenida');
  res.redirect('/auth/login');
});

// ── Rutas públicas (no requieren sesión) ───────────────────────
router.use('/auth', authRouter);

// ── Rutas protegidas (requieren sesión) ───────────────────────
router.use('/panel',         requireAuth, panelRouter);
router.use('/lotes',         requireAuth, lotesRouter);
router.use('/noconformidad', requireAuth, noConformidadRouter);
router.use('/mis-lotes',     requireAuth, operarioRouter);

// Secciones secundarias del sidebar (batch-records, calidad, inventario,
// bitácora, reportes, configuración). El SidebarController las atiende a
// todas y comparten patrón de layout.
router.use('/',              requireAuth, sidebarRouter);

// Bienvenida post-login (RQF-04)
// Vista intermedia entre el login y el panel: muestra la tarjeta de bienvenida
// con el rol, correo y hora de inicio de sesión, y ofrece el botón
// "Continuar al panel" para entrar al dashboard del Director Técnico.
router.get('/bienvenida', requireAuth, (req, res) => {
  res.render('auth/bienvenida', {
    title:  'Bienvenido',
    layout: 'layouts/auth',
  });
});

module.exports = router;
