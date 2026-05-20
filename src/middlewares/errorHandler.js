'use strict';

/**
 * src/middlewares/errorHandler.js
 * Middlewares de manejo de errores y 404.
 *
 * `error.ejs` se renderiza con `layout: false`, por lo que esta vista es un
 * documento HTML completo y no depende de variables del layout principal.
 */

function notFound(req, res, next) {
  const err    = new Error(`Ruta no encontrada: ${req.originalUrl}`);
  err.status   = 404;
  next(err);
}

function errorHandler(err, req, res, next) {
  const status  = err.status || err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';

  // Para clientes que esperan JSON (APIs, fetch con Accept: application/json)
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    return res.status(status).json({ error: message });
  }

  // Log del error en consola para depuración (solo en server, no se filtra al cliente)
  if (status >= 500) {
    console.error('[ERROR]', err.stack || err);
  }

  res.status(status).render('error', {
    layout:  false,           // sin layout para evitar errores en cascada
    title:   `Error ${status}`,
    status,
    message,
  });
}

module.exports = { notFound, errorHandler };
