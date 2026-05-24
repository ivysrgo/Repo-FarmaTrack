/**
 * src/routes/noConformidad.js — Rutas de No Conformidades.
 */
'use strict';

const { Router } = require('express');
const router = Router();

const { getListado, getNueva, postNueva, postResolver } = require('../controllers/NoConformidadController');

router.get ('/',              getListado);    // listado de NCs
router.get ('/nueva',         getNueva);
router.post('/nueva',         postNueva);
router.post('/:id/resolver',  postResolver);

module.exports = router;
