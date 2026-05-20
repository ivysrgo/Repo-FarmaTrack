/**
 * src/routes/noConformidad.js
 * Rutas de No Conformidades.
 */
'use strict';

const { Router } = require('express');
const router = Router();

const { getNueva, postNueva } = require('../controllers/NoConformidadController');

router.get ('/nueva', getNueva);
router.post('/nueva', postNueva);

module.exports = router;
