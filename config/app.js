/**
 * config/app.js
 */
'use strict';

const config = {
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
  },
  app: {
    name:    'FarmaTrack',
    version: '1.0.0',
    env:     process.env.NODE_ENV || 'development',
  },
  session: {
    secret: process.env.SESSION_SECRET || 'farmatrack-secret-2025',
    maxAge: 1000 * 60 * 60 * 8, // 8 horas
  },
};

module.exports = config;
