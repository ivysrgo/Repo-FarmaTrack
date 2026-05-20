/**
 * src/controllers/NoConformidadController.js
 *
 * Controlador de No Conformidades (NC). Versión mínima — el formulario hoy
 * solo acepta el reporte y deja flash. Cuando exista NoConformidadRepository
 * (idealmente respaldado por una colección en Mongo) se reemplaza el cuerpo
 * de postNueva por un insert real y se enlaza al lote correspondiente.
 *
 * Por ahora las NCs en el panel del DT y en la bitácora son mock.
 */
'use strict';

const loteRepo = require('../repositories/LoteRepository');

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

/** GET /noconformidad/nueva */
function getNueva(req, res) {
  // Lotes activos para asociar la NC a uno existente
  const lotesActivos = loteRepo.findAll().filter(l =>
    ['en_espera','en_produccion','pendiente_firma','en_calidad','alerta_bpm','bloqueado'].includes(l.estado)
  );

  res.render('noconformidad/nueva', {
    layout:      'layouts/main',
    title:       'Reportar no conformidad',
    currentPath: '/noconformidad',
    fechaHoy:    buildFechaHoy(),
    usuario:     buildUsuario(res),
    lotesActivos,
    errores:     req.flash('error'),
    values:      {},
  });
}

/** POST /noconformidad/nueva */
function postNueva(req, res) {
  const body = req.body || {};
  const errores = [];

  if (!body.tipo)        errores.push('Selecciona el tipo de no conformidad.');
  if (!body.descripcion || !body.descripcion.trim())
    errores.push('La descripción de la NC es obligatoria.');

  if (errores.length > 0) {
    errores.forEach(e => req.flash('error', e));
    return res.redirect('/noconformidad/nueva');
  }

  // TODO: cuando exista NoConformidadRepository, persistir aquí.
  // Si la NC apunta a un lote y es bloqueante, podemos marcar lote.estado = 'bloqueado'.
  if (body.bloqueante === '1' && body.loteId) {
    const lote = loteRepo.findById(body.loteId);
    if (lote && lote.estado !== 'liberado') {
      loteRepo.update(lote.id, { estado: 'alerta_bpm', observaciones: body.descripcion });
      console.log(`[NC] Lote ${lote.numeroLote} marcado con alerta BPM por NC tipo ${body.tipo}`);
    }
  }

  const usuario = res.locals.currentUser || {};
  const dest = usuario.rol === 'operario' ? '/mis-lotes' : '/panel';
  req.flash('ok', `No conformidad reportada (${body.tipo}). El equipo de calidad fue notificado.`);
  return res.redirect(dest);
}

module.exports = {
  getNueva,
  postNueva,
};
