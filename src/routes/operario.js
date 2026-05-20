/**
 * src/routes/operario.js
 * Rutas del rol Operario de Producción.
 *
 * Endpoints:
 *   GET  /mis-lotes                       → Dashboard "Mis lotes asignados"
 *   GET  /mis-lotes/:id/paso/:n           → Versión EDITABLE del paso N para el operario
 *   POST /mis-lotes/:id/paso/:n           → Guarda el paso N y avanza; en N=9 notifica al DT
 *
 * La liberación final del lote sigue siendo responsabilidad del DT desde
 * /lotes/:id/paso/9 (POST /lotes/:id/liberar) — el operario solo notifica.
 */
'use strict';

const { Router } = require('express');
const router = Router();

const { getDashboard, getPaso, postPaso } = require('../controllers/OperarioController');

router.get ('/',                  getDashboard);
router.get ('/:id/paso/:n',       getPaso);     // vista editable del paso
router.post('/:id/paso/:n',       postPaso);    // guardar y avanzar (o notificar DT si n=9)

module.exports = router;
