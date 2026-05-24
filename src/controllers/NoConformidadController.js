/**
 * src/controllers/NoConformidadController.js (async)
 *
 * Maneja:
 *   GET  /noconformidad/        → listado de NCs (con filtros opcionales)
 *   GET  /noconformidad/nueva   → form para reportar NC
 *   POST /noconformidad/nueva   → procesar reporte
 *   POST /noconformidad/:id/resolver → marcar NC como resuelta
 */
'use strict';

const ncService = require('../service/NoConformidadService');

function buildFechaHoy() {
  const ahora = new Date();
  return ahora.toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'short', year: 'numeric',
  }) + ' · ' + ahora.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

function buildUsuario(res) {
  const u = res.locals.currentUser || { nombre: 'Usuario' };
  const inic = (u.nombre || 'U').split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase();
  return { iniciales: inic, nombre: u.nombre || 'Usuario' };
}

async function getListado(req, res) {
  const ncs = await ncService.listar({});
  const stats = await ncService.stats();
  res.render('noconformidad/listado', {
    layout:      'layouts/main',
    title:       'No conformidades',
    currentPath: '/noconformidad',
    fechaHoy:    buildFechaHoy(),
    usuario:     buildUsuario(res),
    ncs,
    stats,
    flashOk:     req.flash ? req.flash('ok')    : [],
    flashError:  req.flash ? req.flash('error') : [],
  });
}

async function getNueva(req, res) {
  res.render('noconformidad/nueva', {
    layout:      'layouts/main',
    title:       'Reportar no conformidad',
    currentPath: '/noconformidad',
    fechaHoy:    buildFechaHoy(),
    usuario:     buildUsuario(res),
    lotesActivos: await ncService.lotesActivos(),
    errores:     req.flash ? req.flash('error') : [],
    values:      {},
  });
}

async function postNueva(req, res) {
  const body = req.body || {};
  const usuario = res.locals.currentUser || {};
  const result = await ncService.procesar(body, usuario.nombre || '');

  if (!result.ok) {
    result.errores.forEach(e => req.flash('error', e));
    return res.redirect('/noconformidad/nueva');
  }

  if (result.lote) {
    console.log(`[NC] Lote ${result.lote.numeroLote} marcado con alerta BPM por NC tipo ${body.tipo}`);
  }

  const dest = usuario.rol === 'operario' ? '/mis-lotes' : '/panel';
  req.flash('ok', `No conformidad reportada (${body.tipo}). El equipo de calidad fue notificado.`);
  return res.redirect(dest);
}

async function postResolver(req, res) {
  const usuario = res.locals.currentUser || {};
  const result = await ncService.resolver(req.params.id, usuario.nombre || '');

  // Determinar destino: el form puede mandar redirectTo (ej. /bitacora);
  // si no, caemos a la bitácora del DT que es el flujo principal.
  const redirectTo = (req.body && req.body.redirectTo) || '/bitacora';

  if (!result.ok) {
    req.flash('error', result.error);
    return res.redirect(redirectTo);
  }

  const msg = result.loteRestaurado
    ? `NC resuelta. Lote ${result.loteRestaurado.numeroLote} restaurado a "en producción".`
    : `NC resuelta.`;
  req.flash('ok', msg);
  return res.redirect(redirectTo);
}

module.exports = { getListado, getNueva, postNueva, postResolver };
