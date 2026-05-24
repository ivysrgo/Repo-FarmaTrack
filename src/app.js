/**
 * src/app.js - FarmaTrack
 *
 * Bootstrap de la app:
 *   1. Carga .env (dotenv)
 *   2. Conecta a MongoDB Atlas si MONGO_URI esta definida
 *   3. Levanta el servidor Express
 *
 * El composition root de los repositorios (memoria vs Mongo) vive en
 * src/repositories/index.js y se inicializa lazy cuando los services lo piden.
 */
'use strict';

require('dotenv').config();

const express        = require('express');
const path           = require('path');
const morgan         = require('morgan');
const session        = require('express-session');
const flash          = require('connect-flash');
const methodOverride = require('method-override');
const expressLayouts = require('express-ejs-layouts');

const { connectMongo } = require('./config/mongo');
const config = require('../config/app');
const router = require('./routes/index');
const { notFound, errorHandler } = require('./middlewares/errorHandler');

const app = express();

// ── Motor de plantillas ─────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

// ── Middlewares generales ───────────────────────────────────────
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, '..', 'public')));

// ── Sesion ──────────────────────────────────────────────────────
app.use(session({
  secret:            config.session.secret,
  resave:            false,
  saveUninitialized: false,
  cookie: { maxAge: config.session.maxAge, httpOnly: true },
}));

app.use(flash());

// ── Locals globales para vistas ─────────────────────────────────
app.use((req, res, next) => {
  const usuario = req.session.usuario || null;
  const rol     = usuario && usuario.rol;

  res.locals.appName        = config.app.name;
  res.locals.currentPath    = req.path;
  res.locals.currentUser    = usuario;
  res.locals.dashboardPath  = rol === 'operario' ? '/mis-lotes' : '/panel';
  res.locals.dashboardLabel = rol === 'operario' ? 'Mis lotes asignados' : 'Panel de lotes';
  next();
});

app.use('/', router);
app.use(notFound);
app.use(errorHandler);

// ── Arranque ────────────────────────────────────────────────────
async function start() {
  try {
    await connectMongo();   // null si MONGO_URI no esta - la app sigue con repos memoria
  } catch (err) {
    console.error('[app] Conexion a Mongo fallo. La app NO arrancara.');
    process.exit(1);
  }

  const { port, host } = config.server;
  app.listen(port, () => {
    console.log(`\nFarmaTrack corriendo en: http://${host}:${port}`);
    console.log(`Login: http://${host}:${port}/auth/login`);
    console.log(`Panel: http://${host}:${port}/panel`);
    console.log(`Lotes: http://${host}:${port}/lotes\n`);
  });
}

// Solo arrancamos cuando se ejecuta directamente (no en tests/imports)
if (require.main === module) {
  start();
}

module.exports = app;
