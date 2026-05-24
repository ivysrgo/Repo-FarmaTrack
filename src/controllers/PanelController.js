/**
 * src/controllers/PanelController.js (Iteración 4 - bitácora real)
 */
'use strict';

const loteService = require('../service/LoteService');
const eventoService = require('../service/EventoService');
const ncService = require('../service/NoConformidadService');

const VISUAL_POR_TIPO = {
  lote_creado:          'info',
  paso_completado:      'ok',
  lote_pendiente_firma: 'warning',
  lote_liberado:        'ok',
  nc_reportada:         'warning',
  lote_alerta_bpm:      'alert',
};

function _tiempoRelativo(date) {
  const min = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (min < 1)  return 'Hace un momento';
  if (min < 60) return `Hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24)   return `Hace ${h}h`;
  const d = Math.floor(h / 24);
  return `Hace ${d}d`;
}

function buildPendientes(lotes) {
  const pendientes = [];
  for (const l of lotes) {
    const pasoTarget = l.pasoAlerta || l.pasoActual;
    if (l.estado === 'pendiente_firma') {
      pendientes.push({
        tipo: 'firma', label: 'Firma pendiente',
        loteId: l.numeroLote, producto: l.producto,
        accion: 'Firmar', href: `/lotes/${l.id}/paso/9`,
      });
    } else if (l.estado === 'alerta_bpm') {
      pendientes.push({
        tipo: 'alerta', label: 'Revisar desviacion',
        loteId: l.numeroLote,
        producto: l.observaciones || 'Alerta BPM',
        accion: 'Ver', href: `/lotes/${l.id}/paso/${pasoTarget}`,
      });
    } else if (l.estado === 'bloqueado') {
      pendientes.push({
        tipo: 'alerta', label: 'Lote bloqueado',
        loteId: l.numeroLote,
        producto: l.observaciones || 'Bloqueado',
        accion: 'Ver', href: `/lotes/${l.id}/paso/${pasoTarget}`,
      });
    }
  }
  return pendientes;
}

async function _pasoAlertaPorLote() {
  const ncs = await ncService.listar({ resuelta: false, bloqueante: true });
  const map = new Map();
  for (const nc of ncs) {
    if (!nc.loteId || !nc.pasoLote) continue;
    const key = String(nc.loteId);
    if (!map.has(key)) map.set(key, nc.pasoLote);
  }
  return map;
}

async function getPanelDT(req, res) {
  const ahora = new Date();
  const fechaHoy = ahora.toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'short', year: 'numeric',
  }) + ' · ' + ahora.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

  const userLocal = res.locals.currentUser || { iniciales: 'DT', nombre: 'Director Tecnico' };
  const iniciales = userLocal.nombre
    ? userLocal.nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'DT';

  const lotes  = await loteService.findAll();
  const counts = await loteService.stats();

  const tasaBPM = counts.total > 0
    ? Math.round((counts.liberados / counts.total) * 100)
    : 100;

  const pasoAlertaMap = await _pasoAlertaPorLote();
  lotes.forEach(l => {
    const key = String(l.id);
    l.pasoAlerta = pasoAlertaMap.get(key) || null;
  });

  const pendientesReales = buildPendientes(lotes);

  const ultimosEventos = await eventoService.listarUltimos(5);
  const bitacoraReciente = ultimosEventos.map(e => ({
    tipo:    VISUAL_POR_TIPO[e.tipo] || 'info',
    texto:   e.texto,
    tiempo:  _tiempoRelativo(e.createdAt),
    usuario: e.usuario,
  }));

  const okMsg    = req.flash ? req.flash('ok')    : [];
  const errorMsg = req.flash ? req.flash('error') : [];

  res.render('panel/index', {
    title: 'Panel de lotes activos',
    currentPath: '/panel',
    fechaHoy,
    usuario: { iniciales, nombre: userLocal.nombre || 'Director Tecnico' },
    flashOk:    okMsg,
    flashError: errorMsg,
    stats: {
      totalActivos:    counts.total,
      pendientesFirma: counts.pendientesFirma,
      alertasBPM:      counts.alertasBPM,
      tasaBPM,
    },
    tabCounts: {
      todos:           counts.total,
      en_produccion:   counts.enProduccion + counts.alertasBPM,
      en_calidad:      counts.enCalidad,
      pendiente_firma: counts.pendientesFirma,
      liberado:        counts.liberados,
    },
    lotes,
    resumen: {
      lotesIniciados:  counts.enProduccion + counts.pendientesFirma + counts.enCalidad,
      pendientesFirma: counts.pendientesFirma,
      alertasBPM:      counts.alertasBPM,
      liberadosMes:    counts.liberados,
      tasaBPM,
    },
    pendientes: pendientesReales,
    bitacora:   bitacoraReciente,
  });
}

module.exports = { getPanelDT };
