'use strict';
const { Router } = require('express');
const router = Router();
<<<<<<< HEAD
const { getLotesActivos, getLoteDetalle, getPaso, postPaso, getNuevoLote, postNuevoLote } = require('../controllers/LoteController');

router.get('/',                    getLotesActivos);   // Panel de lotes
router.get('/nuevo',               getNuevoLote);      // Formulario nuevo lote
router.post('/nuevo',              postNuevoLote);     // Procesar nuevo lote
router.get('/:id',                 getLoteDetalle);    // Detalle → redirige al paso actual
router.get('/:id/paso/:n',         getPaso);           // Vista de un paso
router.post('/:id/paso/:n/avanzar', postPaso);         // Avanzar al siguiente paso

module.exports = router;
=======
const { getLoteDetalle, getPaso, postPaso, getNuevoLote, postNuevoLote } = require('../controllers/LoteController');

// GET /lotes — Antes mostraba una tabla alterna de lotes; ahora todo el flujo
// pasa por el dashboard del Director Técnico (/panel), así que redirigimos.
router.get('/', (req, res) => res.redirect('/panel'));

router.get('/nuevo',                getNuevoLote);      // Formulario nuevo lote
router.post('/nuevo',               postNuevoLote);     // Procesar nuevo lote
router.get('/:id',                  getLoteDetalle);    // Detalle → redirige al paso actual
router.get('/:id/paso/:n',          getPaso);           // Vista de un paso
router.post('/:id/paso/:n/avanzar', postPaso);          // Avanzar al siguiente paso

module.exports = router;
>>>>>>> d51e171 (CAmbios y Funcionalidades realizadas para FarmaTrack)
