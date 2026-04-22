'use strict';
const { Router } = require('express');
const router = Router();
const { getLotesActivos, getLoteDetalle, getPaso, postPaso, getNuevoLote, postNuevoLote } = require('../controllers/LoteController');

router.get('/',                    getLotesActivos);   // Panel de lotes
router.get('/nuevo',               getNuevoLote);      // Formulario nuevo lote
router.post('/nuevo',              postNuevoLote);     // Procesar nuevo lote
router.get('/:id',                 getLoteDetalle);    // Detalle → redirige al paso actual
router.get('/:id/paso/:n',         getPaso);           // Vista de un paso
router.post('/:id/paso/:n/avanzar', postPaso);         // Avanzar al siguiente paso

module.exports = router;