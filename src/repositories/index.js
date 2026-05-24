/**
 * src/repositories/index.js
 *
 * COMPOSITION ROOT del data layer.
 *   - Si process.env.MONGO_URI -> repos Mongo (Atlas)
 *   - Si no -> repos en memoria (tests / demo offline)
 */
'use strict';
require('dotenv').config();

let _loteRepo    = null;
let _usuarioRepo = null;
let _ncRepo      = null;
let _eventoRepo  = null;
let _mpRepo      = null;

function _initRepos() {
  if (process.env.MONGO_URI && process.env.USE_MEMORY_REPOS !== 'true') {
    _loteRepo    = require('./LoteRepositoryMongo');
    _usuarioRepo = require('./UsuarioRepositoryMongo');
    _ncRepo      = require('./NoConformidadRepositoryMongo');
    _eventoRepo  = require('./EventoRepositoryMongo');
    _mpRepo      = require('./MateriaPrimaRepositoryMongo');
    console.log('[repositories] Modo MongoDB (Atlas)');
  } else {
    _loteRepo    = require('./LoteRepository');
    _usuarioRepo = require('./UsuarioRepository');
    _ncRepo      = require('./NoConformidadRepository');
    _eventoRepo  = require('./EventoRepository');
    _mpRepo      = require('./MateriaPrimaRepository');
    console.log('[repositories] Modo memoria (mock)');
  }
}

function getLoteRepo()         { if (!_loteRepo) _initRepos(); return _loteRepo; }
function getUsuarioRepo()      { if (!_usuarioRepo) _initRepos(); return _usuarioRepo; }
function getNCRepo()           { if (!_ncRepo) _initRepos(); return _ncRepo; }
function getEventoRepo()       { if (!_eventoRepo) _initRepos(); return _eventoRepo; }
function getMateriaPrimaRepo() { if (!_mpRepo) _initRepos(); return _mpRepo; }

function setRepos({ loteRepo, usuarioRepo, ncRepo, eventoRepo, mpRepo } = {}) {
  if (loteRepo)    _loteRepo    = loteRepo;
  if (usuarioRepo) _usuarioRepo = usuarioRepo;
  if (ncRepo)      _ncRepo      = ncRepo;
  if (eventoRepo)  _eventoRepo  = eventoRepo;
  if (mpRepo)      _mpRepo      = mpRepo;
}

function resetRepos() {
  _loteRepo = _usuarioRepo = _ncRepo = _eventoRepo = _mpRepo = null;
}

module.exports = {
  getLoteRepo, getUsuarioRepo, getNCRepo, getEventoRepo, getMateriaPrimaRepo,
  setRepos, resetRepos,
};
