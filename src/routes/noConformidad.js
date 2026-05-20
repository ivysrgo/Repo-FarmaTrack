'use strict';
const { Router } = require('express');
const router = Router();
const {
  mostrarFormulario,
  procesarFormulario,
} = require('../controllers/NoConformidadController');

// GET  /noconformidad/nueva
router.get('/nueva', mostrarFormulario);

// POST /noconformidad
router.post('/', procesarFormulario);

module.exports = router;
