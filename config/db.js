/**
 * config/db.js
 * Conexión a MongoDB Atlas. Lee MONGO_URI desde .env.
 *
 * Lo invoca src/app.js al arrancar el server. Si la conexión falla, el proceso
 * termina con código 1 — preferimos arrancar a sabiendas que con un repo medio
 * conectado que da errores en cascada al primer request.
 */
'use strict';
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB conectado');
  } catch (err) {
    console.error('❌ Error conectando a MongoDB:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
