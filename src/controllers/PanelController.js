/**
 * src/controllers/PanelController.js
 * Panel de lotes activos — Director Técnico (RQF-06).
 *
 * Lee SIEMPRE desde LoteRepository: cualquier lote creado vía
 * /lotes/nuevo aparece automáticamente aquí.
 */
'use strict';

const loteRepo = require('../repositories/LoteRepository');

// Los pendientes y la bitácora siguen siendo mock por ahora — su día llegará
// cuando aparezcan FirmaRepository y EventoHistorialRepository.
const PENDIENTES_MOCK = [
  {
    tipo: 'firma',
    label: 'Firma pendiente',
    loteId: 'FT-2026-0040',
    producto: 'Loratadina 10mg',
    accion: 'Firmar',
    href: '/lotes/4/paso/9',
  },
  {
    tipo: 'alerta',
    label: 'Revisar desviación',
    loteId: 'FT-2026-0044',
    producto: 'Temperatura fuera de rango',
    accion: 'Ver',
    href: '/noconformidad/nueva',
  },
  {
    tipo: 'calidad',
    label: 'Comité de calidad',
    loteId: '',
    producto: 'Hoy 3:00 p.m. · Sala B · 3 lotes',
    accion: 'Ver',
    href: '/panel',
  },
];

const BITACORA_MOCK = [
  { tipo: 'ok',      texto: 'FT-2026-0041 · Paso 5 iniciado',        tiempo: 'Hace 12 min',  usuario: 'C. Rodríguez' },
  { tipo: 'warning', texto: 'FT-2026-0042 · Pendiente verificación',  tiempo: 'Hace 28 min',  usuario: 'Sistema' },
  { tipo: 'alert',   texto: 'FT-2026-0044 · Alerta BPM temperatura',  tiempo: 'Hace 1h 04m', usuario: 'Sistema' },
  { tipo: 'info',    texto: 'FT-2026-0040 · Batch record generado',   tiempo: 'Hace 2h 15m', usuario: 'Sistema' },
  { tipo: 'ok',      texto: 'FT-2026-0043 · Paso 7 completado',       tiempo: 'Hace 3h 02m', usuario: 'A. Gómez' },
];

/**
 * GET /panel
 */
function getPanelDT(req, res) {
  const ahora = new Date();
  const fechaHoy = ahora.toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'short', year: 'numeric',
  }) + ' · ' + ahora.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

  const usuario = res.locals.currentUser || { iniciales: 'DT', nombre: 'Director Técnico' };
  const iniciales = usuario.nombre
    ? usuario.nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'DT';

  // ⬇️ Una sola fuente de verdad: LoteRepository
  const lotes  = loteRepo.findAll();
  const counts = loteRepo.stats();

  // Mensajes flash (ej. "Orden creada con éxito" tras /lotes/nuevo)
  const okMsg    = req.flash ? req.flash('ok')    : [];
  const errorMsg = req.flash ? req.flash('error') : [];

  res.render('panel/index', {
    title: 'Panel de lotes activos',
    currentPath: '/panel',
    fechaHoy,
    usuario: { iniciales, nombre: usuario.nombre || 'Director Técnico' },
    flashOk:    okMsg,
    flashError: errorMsg,

    stats: {
      totalActivos:    counts.total,
      deltaVsAyer:     2,                       // mock — luego viene de eventos históricos
      pendientesFirma: counts.pendientesFirma,
      alertasBPM:      counts.alertasBPM,
      tasaBPM:         94,                      // mock — luego se calcula real
    },

    lotes,
    resumen: {
      lotesIniciados: counts.enProduccion + counts.pendientesFirma + counts.enCalidad,
      pendientesFirma: counts.pendientesFirma,
      alertasBPM:     counts.alertasBPM,
      liberadosMes:   counts.liberados,
      tasaBPM:        94,
    },
    pendientes: PENDIENTES_MOCK,
    bitacora:   BITACORA_MOCK,
  });
}

module.exports = { getPanelDT };
