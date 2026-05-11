'use strict';

<<<<<<< HEAD
=======
/**
 * src/middlewares/errorHandler.js
 * Middlewares de manejo de errores y 404.
 *
 * `error.ejs` se renderiza con `layout: false`, por lo que esta vista es un
 * documento HTML completo y no depende de variables del layout principal.
 */

>>>>>>> d51e171 (CAmbios y Funcionalidades realizadas para FarmaTrack)
function notFound(req, res, next) {
  const err    = new Error(`Ruta no encontrada: ${req.originalUrl}`);
  err.status   = 404;
  next(err);
}

function errorHandler(err, req, res, next) {
  const status  = err.status || err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';

<<<<<<< HEAD
=======
  // Para clientes que esperan JSON (APIs, fetch con Accept: application/json)
>>>>>>> d51e171 (CAmbios y Funcionalidades realizadas para FarmaTrack)
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    return res.status(status).json({ error: message });
  }

<<<<<<< HEAD
  res.status(status).render('error', {
    layout:  false,          // sin layout para evitar errores en cascada
=======
  // Log del error en consola para depuración (solo en server, no se filtra al cliente)
  if (status >= 500) {
    console.error('[ERROR]', err.stack || err);
  }

  res.status(status).render('error', {
    layout:  false,           // sin layout para evitar errores en cascada
>>>>>>> d51e171 (CAmbios y Funcionalidades realizadas para FarmaTrack)
    title:   `Error ${status}`,
    status,
    message,
  });
}

module.exports = { notFound, errorHandler };
<<<<<<< HEAD

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
=======
>>>>>>> d51e171 (CAmbios y Funcionalidades realizadas para FarmaTrack)
