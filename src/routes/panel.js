/**
 * src/routes/panel.js
 * Ruta del dashboard del Director Técnico.
 */
'use strict';

const { Router } = require('express');
const router = Router();

const { getPanelDT } = require('../controllers/PanelController');

router.get('/', getPanelDT);

module.exports = router;
