/**
 * src/app.js — FarmaTrack
 * Punto de entrada principal.
 * Integra: Login (bahos) + Panel/Lotes (base + sergio) + No-conformidades (base)
 */
'use strict';

const express        = require('express');
const path           = require('path');
const morgan         = require('morgan');
const session        = require('express-session');
const flash          = require('connect-flash');
const methodOverride = require('method-override');
const expressLayouts = require('express-ejs-layouts');

const config = require('../config/app');
const router = require('./routes/index');
const { notFound, errorHandler } = require('./middlewares/errorHandler');

const app = express();

// ── Motor de plantillas ─────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');        // layout principal con sidebar
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

// ── Middlewares generales ───────────────────────────────────────
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, '..', 'public')));

// ── Sesión ──────────────────────────────────────────────────────
app.use(session({
  secret:            config.session.secret,
  resave:            false,
  saveUninitialized: false,
  cookie: {
    maxAge:   config.session.maxAge,
    httpOnly: true,
  },
}));

// ── Flash messages ──────────────────────────────────────────────
app.use(flash());

// ── Variables globales para todas las vistas ───────────────────
app.use((req, res, next) => {
  res.locals.appName     = config.app.name;
  res.locals.currentPath = req.path;
  res.locals.currentUser = req.session.usuario || null;
  next();
});

// ── Rutas ───────────────────────────────────────────────────────
app.use('/', router);

// ── Manejo de errores ───────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Arranque ────────────────────────────────────────────────────
const { port, host } = config.server;
app.listen(port, () => {
  console.log(`\n🚀 FarmaTrack corriendo en: http://${host}:${port}`);
  console.log(`🔐 Login:  http://${host}:${port}/auth/login`);
  console.log(`📋 Panel:  http://${host}:${port}/panel`);
  console.log(`🏭 Lotes:  http://${host}:${port}/lotes\n`);
});

module.exports = app;
