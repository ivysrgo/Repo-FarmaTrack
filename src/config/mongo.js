/**
 * src/config/mongo.js
 *
 * Conexion a MongoDB Atlas. La URI se lee de process.env.MONGO_URI
 * (definida en .env).
 *
 * Patron:
 *   - connectMongo() retorna una Promise que resuelve cuando la conexion
 *     esta lista.
 *   - Si MONGO_URI no esta definida, resuelve con null y deja que la app
 *     siga funcionando con los repositorios en memoria (modo demo offline).
 *   - Si la conexion falla, lanza el error para que el caller decida si
 *     aborta la app o cae al modo memoria.
 *
 * Uso:
 *   const { connectMongo } = require('./config/mongo');
 *   await connectMongo();   // antes de levantar el server
 */
'use strict';

const mongoose = require('mongoose');
require('dotenv').config();

const DB_NAME = 'farmatrack';

let _connection = null;

async function connectMongo() {
  if (_connection) return _connection;          // idempotente

  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.warn('[mongo] MONGO_URI no definida. La app correra con repositorios en memoria.');
    return null;
  }

  try {
    await mongoose.connect(uri, {
      dbName: DB_NAME,
      serverSelectionTimeoutMS: 8000,
    });
    _connection = mongoose.connection;
    console.log(`[mongo] Conectado a Atlas - DB: ${DB_NAME}`);
    return _connection;
  } catch (err) {
    console.error('[mongo] Error de conexion:', err.message);
    throw err;
  }
}

async function disconnectMongo() {
  if (_connection) {
    await mongoose.disconnect();
    _connection = null;
    console.log('[mongo] Desconectado');
  }
}

function isConnected() {
  return mongoose.connection.readyState === 1;
}

module.exports = { connectMongo, disconnectMongo, isConnected, DB_NAME };
