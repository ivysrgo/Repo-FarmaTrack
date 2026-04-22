'use strict';

function notFound(req, res, next) {
  const err    = new Error(`Ruta no encontrada: ${req.originalUrl}`);
  err.status   = 404;
  next(err);
}

function errorHandler(err, req, res, next) {
  const status  = err.status || err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';

  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    return res.status(status).json({ error: message });
  }

  res.status(status).render('error', {
    layout:  false,          // sin layout para evitar errores en cascada
    title:   `Error ${status}`,
    status,
    message,
  });
}

module.exports = { notFound, errorHandler };

function errorHandler(err, req, res, next) {
  const status  = err.status || err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';

  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    return res.status(status).json({ error: message });
  }

  // ✅ Agregar fechaHoy y usuario para que el layout no falle
  const ahora = new Date();
  const fechaHoy = ahora.toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'short', year: 'numeric',
  });
  const usuario = res.locals.currentUser || { iniciales: 'DT', nombre: 'Director Técnico' };

  res.status(status).render('error', {
    layout:   false,
    title:    `Error ${status}`,
    status,
    message,
    fechaHoy,  
    usuario,   
  });
}