import { Router } from "express";
const router = Router();

// ── Datos mock (simulan MongoDB — RQF-02, RQF-06) ─────────
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
    href: '/lotes/LT-2024-083/alerta',
  },
  {
    tipo: 'calidad',
    label: 'Comité de calidad',
    loteId: '',
    producto: 'Hoy 3:00 p.m. · Sala B · 3 lotes',
    accion: 'Ver',
    href: '/calidad/comite',
  },
];

const BITACORA_MOCK = [
  { tipo: 'ok',      texto: 'LT-2024-089 · Paso 3 iniciado',       tiempo: 'Hace 12 min', usuario: 'D. Peña' },
  { tipo: 'warning', texto: 'LT-2024-087 · Pendiente verificación', tiempo: 'Hace 28 min', usuario: 'Sistema' },
  { tipo: 'alert',   texto: 'LT-2024-083 · Alerta BPM temperatura', tiempo: 'Hace 1h 04m', usuario: 'Sistema' },
  { tipo: 'info',    texto: 'LT-2024-081 · Batch record generado',  tiempo: 'Hace 2h 15m', usuario: 'Sistema' },
  { tipo: 'ok',      texto: 'LT-2024-085 · Paso 7 completado',      tiempo: 'Hace 3h 02m', usuario: 'J. Baños' },
];

// ── Panel de lotes activos — home del Director Técnico ────
// (RQF-06) muestra todos los lotes activos con su estado
router.get('/', (req, res) => {
  const ahora = new Date();
  const fechaHoy = ahora.toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'short', year: 'numeric',
  }) + ' · ' + ahora.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) + ' a.m.';

  res.render('panel/index', {
    title: 'Panel de lotes activos',
    fechaHoy,
    usuario: { iniciales: 'DT', nombre: 'Director Técnico' },

    // KPI stats (RQF-06)
    stats: {
      totalActivos: LOTES_MOCK.length,
      deltaVsAyer: 2,
      pendientesFirma: LOTES_MOCK.filter(l => l.estadoSlug === 'pendiente_firma').length,
      alertasBPM: LOTES_MOCK.filter(l => l.estadoSlug === 'alerta_bpm').length,
      tasaBPM: 94,
    },

    // Lista de lotes (RQF-03, RQF-04)
    lotes: LOTES_MOCK,

    // Resumen del día
    resumen: {
      lotesIniciados: 2,
      pendientesFirma: 3,
      alertasBPM: 2,
      liberadosMes: 14,
      tasaBPM: 94,
    },

    // Pendientes de atención del DT
    pendientes: PENDIENTES_MOCK,

    // Bitácora reciente (RQF-29)
    bitacora: BITACORA_MOCK,
  });
});

// ── Módulo: No conformidad (RQF-21) ──────────────────────
/**
 * GET /noconformidad/nueva
 * Muestra el formulario para registrar una nueva no conformidad.
 */
router.get('/noconformidad/nueva', (req, res) => {
  res.render('noconformidad/nueva', {
    title: 'Registrar no conformidad',
    errores: [],
    lote: {
      id: 'LT-2024-089',
      producto: 'Amoxicilina 500mg',
      paso: 'Paso 3 — Verificación de pesos',
      operario: 'Juan Bahos',
    },
  });
});

/**
 * POST /noconformidad
 * Procesa el formulario de no conformidad.
 * _action = 'guardar'  → guarda borrador
 * _action = 'reportar' → registra y notifica al DT (RQF-22, RQF-23)
 */
router.post('/noconformidad', (req, res) => {
  const {
    loteRef, pasoProceso, producto, operario, fechaHora,
    tipoNC, parametro, valorEsperado, valorObtenido,
    descripcionDesviacion, severidad, impactoProceso,
    accionInmediata, _action,
  } = req.body;

  // Validación de campos obligatorios (RQF-12)
  const errores = [];
  if (!parametro?.trim())             errores.push('El parámetro afectado es obligatorio.');
  if (!valorEsperado?.trim())         errores.push('El valor esperado es obligatorio.');
  if (!valorObtenido?.trim())         errores.push('El valor obtenido es obligatorio.');
  if (!descripcionDesviacion?.trim()) errores.push('La descripción detallada es obligatoria.');
  if (!severidad)                     errores.push('Debes seleccionar el nivel de severidad.');
  if (!impactoProceso?.trim())        errores.push('El impacto en el proceso es obligatorio.');
  if (!accionInmediata?.trim())       errores.push('La acción inmediata es obligatoria.');

  if (errores.length > 0) {
    return res.status(422).render('noconformidad/nueva', {
      title: 'Registrar no conformidad',
      errores,
      lote: { id: loteRef, producto, paso: pasoProceso, operario },
    });
  }

  // TODO: persistir en MongoDB y emitir evento de bitácora (RQF-27)
  // TODO: si _action === 'reportar', notificar al DT (RQF-23)
  //       y bloquear avance del lote (RQF-22)

  console.log(`[NC] ${_action?.toUpperCase()} | Lote: ${loteRef} | Severidad: ${severidad} | Parámetro: ${parametro}`);

  res.redirect('/?flash=nc_guardada');
});

export default router;
