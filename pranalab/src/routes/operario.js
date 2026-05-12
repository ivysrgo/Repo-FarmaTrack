/**
 * src/routes/operario.js
 * Rutas del rol Operario de Producción.
 *
 * Por ahora solo expone el dashboard ("Mis lotes asignados"). En las próximas
 * iteraciones aquí se agregarán las versiones EDITABLES del stepper (paso 1..9
 * para el operario), las acciones de avance de paso, y el reporte de NC.
 */
'use strict';

const { Router } = require('express');
const router = Router();

const { getDashboard } = require('../controllers/OperarioController');

// GET /mis-lotes — Dashboard del operario
router.get('/', getDashboard);

module.exports = router;
