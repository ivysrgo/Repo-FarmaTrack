/**
 * src/routes/auth.js
 * Rutas de autenticación. Conecta los handlers del AuthController (que ahora
 * son funciones planas, no métodos de instancia — ver la nota en AuthController).
 */
'use strict';

const { Router } = require('express');
const router = Router();

const { showLogin, login, signup, logout } = require('../controllers/AuthController');

router.get ('/login',  showLogin);
router.post('/login',  login);
router.post('/signup', signup);
router.post('/logout', logout);

module.exports = router;
