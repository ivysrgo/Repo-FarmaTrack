/**
 * src/controllers/PanelController.js
 * Panel de lotes activos para el Director Técnico.
 * RQF-06: Vista de todos los lotes con estado y KPIs.
 */
'use strict';

// ── Datos mock (reemplazar por BD real) ───────────────────────
const LOTES_MOCK = [
  {
    id: 'LT-2024-089',
    producto: 'Amoxicilina 500mg',
    estadoSlug: 'en_produccion',
    estadoLabel: 'En producción',
    pasoActual: 3,
    operario: 'D. Peña',
    operarioIniciales: 'DP',
    tiempoTranscurrido: '2h 15m',
  },
  {
    id: 'LT-2024-087',
    producto: 'Ibuprofeno 400mg',
    estadoSlug: 'pendiente_firma',
    estadoLabel: 'Pendiente verif.',
    pasoActual: 5,
    operario: 'S. Velandia',
    operarioIniciales: 'SV',
    tiempoTranscurrido: '4h 30m',
  },
  {
    id: 'LT-2024-085',
    producto: 'Metformina 850mg',
    estadoSlug: 'en_calidad',
    estadoLabel: 'En calidad',
    pasoActual: 7,
    operario: 'J. Bahos',
    operarioIniciales: 'JB',
    tiempoTranscurrido: '6h 50m',
  },
  {
    id: 'LT-2024-083',
    producto: 'Ciprofloxacina 500mg',
    estadoSlug: 'alerta_bpm',
    estadoLabel: 'Alerta BPM',
    pasoActual: 3,
    operario: 'D. Peña',
    operarioIniciales: 'DP',
    tiempoTranscurrido: '1h 10m',
  },
];

const PENDIENTES_MOCK = [
  {
    tipo: 'firma',
    label: 'Firma pendiente',
    loteId: 'LT-2024-081',
    producto: 'Atorvastatina 20mg',
    accion: 'Firmar',
    href: '/lotes/LT-2024-081/firma',
  },
  {
    tipo: 'alerta',
    label: 'Revisar desviación',
    loteId: 'LT-2024-083',
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
    href: '/lotes',
  },
];

const BITACORA_MOCK = [
  { tipo: 'ok',      texto: 'LT-2024-089 · Paso 3 iniciado',        tiempo: 'Hace 12 min',  usuario: 'D. Peña' },
  { tipo: 'warning', texto: 'LT-2024-087 · Pendiente verificación',  tiempo: 'Hace 28 min',  usuario: 'Sistema' },
  { tipo: 'alert',   texto: 'LT-2024-083 · Alerta BPM temperatura',  tiempo: 'Hace 1h 04m', usuario: 'Sistema' },
  { tipo: 'info',    texto: 'LT-2024-081 · Batch record generado',   tiempo: 'Hace 2h 15m', usuario: 'Sistema' },
  { tipo: 'ok',      texto: 'LT-2024-085 · Paso 7 completado',       tiempo: 'Hace 3h 02m', usuario: 'J. Bahos' },
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

  res.render('panel/index', {
    title: 'Panel de lotes activos',
    currentPath: '/panel',
    fechaHoy,
    usuario: { iniciales, nombre: usuario.nombre || 'Director Técnico' },

    stats: {
      totalActivos:   LOTES_MOCK.length,
      deltaVsAyer:    2,
      pendientesFirma: LOTES_MOCK.filter(l => l.estadoSlug === 'pendiente_firma').length,
      alertasBPM:     LOTES_MOCK.filter(l => l.estadoSlug === 'alerta_bpm').length,
      tasaBPM:        94,
    },

    lotes:    LOTES_MOCK,
    resumen:  { lotesIniciados: 2, pendientesFirma: 3, alertasBPM: 2, liberadosMes: 14, tasaBPM: 94 },
    pendientes: PENDIENTES_MOCK,
    bitacora:   BITACORA_MOCK,
  });
}

module.exports = { getPanelDT };
