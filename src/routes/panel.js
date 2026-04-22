'use strict';
const { Router } = require('express');
const router = Router();
const { getPanelDT } = require('../controllers/PanelController');

// GET /panel — Dashboard del Director Técnico
router.get('/', getPanelDT);

module.exports = router;
