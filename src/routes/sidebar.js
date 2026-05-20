/**
 * src/routes/sidebar.js
 *
 * Rutas de las secciones secundarias del sidebar. Todas protegidas por
 * requireAuth desde index.js. El controlador `SidebarController` se encarga
 * de leer del LoteRepository y servir las vistas.
 */
'use strict';

const { Router } = require('express');
const router = Router();

const {
  getBatchRecords,
  getCalidad,
  getInventario,
  getBitacora,
  getReportes,
  getConfiguracion,
} = require('../controllers/SidebarController');

router.get('/batch-records', getBatchRecords);
router.get('/calidad',       getCalidad);
router.get('/inventario',    getInventario);
router.get('/bitacora',      getBitacora);
router.get('/reportes',      getReportes);
router.get('/configuracion', getConfiguracion);

module.exports = router;
