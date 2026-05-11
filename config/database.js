<<<<<<< HEAD
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB conectado');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
=======
/**
 * config/database.js
 * Base de datos en memoria para FarmaTrack.
 * Contiene usuarios del sistema con contraseñas en texto plano (demo).
 * En producción: usar bcrypt + MongoDB/PostgreSQL.
 */
'use strict';

const db = {
  usuarios: [
    {
      id:       'u-001',
      nombre:   'Juan Bahos',
      email:    'juan.bahos@farmatrack.co',
      password: '1234',
      rol:      'director_tecnico',
      cargo:    'Director Técnico',
      activo:   true,
    },
    {
      id:       'u-002',
      nombre:   'Sergio Velandia',
      email:    'sergio.velandia@farmatrack.co',
      password: '1234',
      rol:      'operario',
      cargo:    'Operario de Producción',
      activo:   true,
    },
    {
      id:       'u-003',
      nombre:   'David Peña',
      email:    'david.pena@farmatrack.co',
      password: '1234',
      rol:      'operario',
      cargo:    'Operario de Producción',
      activo:   true,
    },
  ],
};

module.exports = db;
>>>>>>> d51e171 (CAmbios y Funcionalidades realizadas para FarmaTrack)
