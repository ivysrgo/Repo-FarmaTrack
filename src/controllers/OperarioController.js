/**
 * src/controllers/OperarioController.js
 * Dashboard "Mis lotes asignados" — vista del Operario de Producción.
 *
 * Lee SIEMPRE desde LoteRepository (misma fuente de verdad que el DT).
 * Filtra los lotes por `lote.operario === currentUser.nombre` y separa
 * los activos de los completados del día.
 *
 * Si el usuario logueado no tiene lotes asignados (caso típico durante el
 * desarrollo, porque los demos del repo están a nombre de Carlos Rodríguez,
 * Luisa Martínez, etc.), cae a un modo demostración mostrando los primeros
 * lotes activos. Cuando MongoDB esté en línea y la asignación venga de la
 * BD esto se elimina.
 */
'use strict';

const loteRepo = require('../repositories/LoteRepository');

// Estados que cuentan como "lote activo en mi turno"
const ESTADOS_ACTIVOS = ['en_espera', 'en_produccion', 'pendiente_firma', 'en_calidad', 'alerta_bpm', 'bloqueado'];

function buildFechaHoy() {
  const ahora = new Date();
  return ahora.toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'short', year: 'numeric',
  }) + ' · ' + ahora.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

function inicialesDe(nombre) {
  if (!nombre) return 'OP';
  return nombre.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

/**
 * Devuelve la etiqueta y la acción contextual del botón principal según
 * el estado del lote — coincide con el wireframe de Frame 10.
 */
function accionDeLote(lote) {
  switch (lote.estado) {
    case 'en_produccion':
      return { label: 'Continuar paso →',  variante: 'primary' };
    case 'pendiente_firma':
      return { label: 'Revisar pendiente →', variante: 'warning' };
    case 'en_espera':
      return { label: 'Iniciar lote →',    variante: 'primary' };
    case 'alerta_bpm':
      return { label: 'Resolver alerta →', variante: 'alert'  };
    case 'en_calidad':
      return { label: 'Ver controles →',   variante: 'secondary' };
    case 'bloqueado':
      return { label: 'Ver bloqueo →',     variante: 'alert'  };
    default:
      return { label: 'Abrir lote →',      variante: 'secondary' };
  }
}

/**
 * GET /mis-lotes
 * Dashboard del Operario.
 */
function getDashboard(req, res) {
  const sesion   = res.locals.currentUser || {};
  const nombre   = sesion.nombre || 'Operario';
  const cargo    = sesion.cargo  || 'Operario de Producción';
  const usuario  = { iniciales: inicialesDe(nombre), nombre, cargo };

  // ── 1. Lotes asignados a este operario ───────────────────────
  const todos  = loteRepo.findAll();
  let misLotes = todos.filter(l => (l.operario || '').toLowerCase() === nombre.toLowerCase());

  // Si el operario no tiene lotes propios asignados, mostramos los primeros
  // lotes activos del repo como respaldo (sin avisos visuales — esto es
  // transitorio mientras Mongo aporta la asignación real).
  if (misLotes.length === 0) {
    misLotes = todos.filter(l => ESTADOS_ACTIVOS.includes(l.estado)).slice(0, 4);
  }

  // ── 2. Activos vs Completados hoy ────────────────────────────
  const activos        = misLotes
    .filter(l => ESTADOS_ACTIVOS.includes(l.estado))
    .map(l => ({
      ...l,
      progresoPct: Math.round(((l.pasoActual - 1) / 9) * 100),
      accion:      accionDeLote(l),
    }));

  const completadosHoy = misLotes
    .filter(l => l.estado === 'liberado')
    .map(l => ({ ...l, completadoHace: l.tiempoTranscurrido || '—' }));

  // ── 3. Stats del turno (mock parcial — luego viene de EventoRepository) ──
  const pasosCompletados = activos.reduce((sum, l) => sum + Math.max(0, l.pasoActual - 1), 0)
                         + completadosHoy.length * 9;
  const ncDelTurno = activos.filter(l => l.estado === 'alerta_bpm' || l.estado === 'bloqueado').length;
  const loteActual = activos[0];

  const turno = {
    horario:          'Mañana 6:00 - 14:00',
    lotesAsignados:   `${activos.length} activos${completadosHoy.length ? ` + ${completadosHoy.length} completado${completadosHoy.length === 1 ? '' : 's'}` : ''}`,
    pasosCompletados: `${pasosCompletados} hoy`,
    noConformidades:  `${ncDelTurno} hoy`,
    pasoActual:       loteActual ? `Paso ${loteActual.pasoActual} — ${loteActual.numeroLote}` : '—',
    activo:           true,
    area:             'Manufactura sólidos',
  };

  // Lote pendiente de verificación del DT (alerta amarilla del aside)
  const pendienteDT = activos.find(l => l.estado === 'pendiente_firma') || null;

  // Mensajes flash (ej. "Lote ... liberado y firmado por ..." tras /lotes/:id/liberar).
  // Mismo patrón que en PanelController para mantener consistencia.
  const flashOk    = req.flash ? req.flash('ok')    : [];
  const flashError = req.flash ? req.flash('error') : [];

  res.render('operario/dashboard', {
    layout:      'layouts/main',
    title:       'Mis lotes asignados',
    currentPath: '/mis-lotes',
    fechaHoy:    buildFechaHoy(),
    usuario,
    activos,
    completadosHoy,
    turno,
    pendienteDT,
    flashOk,
    flashError,
  });
}

// ── Definición de los 9 pasos (espejo del LoteController) ────────
const PASOS = [
  { n: 1, nombre: 'Recepción de la orden' },
  { n: 2, nombre: 'Traslado de materias primas' },
  { n: 3, nombre: 'Verificación de pesos' },
  { n: 4, nombre: 'Instructivo de manufactura' },
  { n: 5, nombre: 'Controles de calidad' },
  { n: 6, nombre: 'Retiro de marmita' },
  { n: 7, nombre: 'Empaque y tapado' },
  { n: 8, nombre: 'Área de acondicionamiento' },
  { n: 9, nombre: 'Etiquetado' },
];

/**
 * GET /mis-lotes/:id/paso/:n
 *
 * Renderiza la versión EDITABLE del paso para el operario, leyendo el lote
 * del repositorio. No se permite saltar a un paso futuro (lote.pasoActual);
 * si el operario intenta abrir uno más allá, lo redirigimos al paso actual.
 */
function getPaso(req, res, next) {
  const loteRepoLocal = require('../repositories/LoteRepository');
  const lote = loteRepoLocal.findById(req.params.id);
  if (!lote) {
    const err = new Error('Lote no encontrado'); err.status = 404; return next(err);
  }

  const n = parseInt(req.params.n, 10);
  if (Number.isNaN(n) || n < 1 || n > 9) {
    return res.redirect(`/mis-lotes/${lote.id}/paso/${lote.pasoActual}`);
  }
  // Bloquea avance manual a pasos no alcanzados aún
  if (n > lote.pasoActual) {
    return res.redirect(`/mis-lotes/${lote.id}/paso/${lote.pasoActual}`);
  }

  const sesion   = res.locals.currentUser || {};
  const usuario  = { iniciales: inicialesDe(sesion.nombre || 'Operario'), nombre: sesion.nombre || 'Operario' };
  const operario = { nombre: lote.operario || sesion.nombre || 'Operario', iniciales: lote.operarioIniciales || inicialesDe(lote.operario) };
  const tiempos  = ['0m','20m','48m','1h 30m','2h 15m','3h 40m','4h 10m','5h 20m','6h 00m'];

  res.render(`operario/pasos/paso${n}`, {
    layout:      'layouts/main',
    title:       `Paso ${n}/9 — ${PASOS[n-1].nombre}`,
    currentPath: '/mis-lotes',
    fechaHoy:    buildFechaHoy(),
    usuario,
    operario,
    lote,
    paso:        n,
    pasos:       PASOS,
    nombrePaso:  PASOS[n-1].nombre,
    tiempoTranscurrido: tiempos[n-1],
  });
}

/**
 * POST /mis-lotes/:id/paso/:n
 *
 * Guarda los datos del paso y avanza al siguiente. Por ahora solo persistimos
 * las observaciones del paso (las demás inputs van a la bitácora cuando
 * exista EventoRepository). Para el paso 9 hace algo distinto: cambia el
 * estado a `pendiente_firma` y deja al operario fuera del flujo activo —
 * el DT verá el lote como pendiente en su panel y podrá liberarlo desde su
 * propio /lotes/:id/paso/9.
 */
function postPaso(req, res, next) {
  const loteRepoLocal = require('../repositories/LoteRepository');
  const lote = loteRepoLocal.findById(req.params.id);
  if (!lote) {
    const err = new Error('Lote no encontrado'); err.status = 404; return next(err);
  }

  const n = parseInt(req.params.n, 10);
  if (Number.isNaN(n) || n < 1 || n > 9) {
    return res.redirect(`/mis-lotes/${lote.id}/paso/${lote.pasoActual}`);
  }

  const obs = (req.body && typeof req.body.observaciones === 'string')
    ? req.body.observaciones.trim()
    : '';

  // ── Paso 9: notificación al DT ──────────────────────────────
  if (n === 9) {
    // No re-notificar si ya está pendiente o liberado
    if (lote.estado === 'pendiente_firma' || lote.estado === 'liberado') {
      req.flash('error', `El lote ${lote.numeroLote} ya fue notificado al DT.`);
      return res.redirect(`/mis-lotes/${lote.id}/paso/9`);
    }

    loteRepoLocal.update(lote.id, {
      estado:        'pendiente_firma',
      pasoActual:    9,
      observaciones: obs || lote.observaciones,
    });

    console.log(`[NOTIFICACIÓN DT] Lote ${lote.numeroLote} marcado como pendiente_firma por ${lote.operario}`);
    req.flash('ok', `Lote ${lote.numeroLote} notificado al Director Técnico para revisión y firma de liberación.`);
    return res.redirect('/mis-lotes');
  }

  // ── Pasos 1..8: avanzar al siguiente ────────────────────────
  const siguiente = n + 1;
  const patch = {
    observaciones: obs || lote.observaciones,
    pasoActual:    Math.max(lote.pasoActual, siguiente),
  };
  // Al arrancar (paso 1 → 2) cambia de "en_espera" a "en_produccion"
  if (lote.estado === 'en_espera') {
    patch.estado = 'en_produccion';
  }
  loteRepoLocal.update(lote.id, patch);

  console.log(`[PASO COMPLETADO] Lote ${lote.numeroLote} — paso ${n} guardado por ${lote.operario}, avanzando a paso ${siguiente}`);
  return res.redirect(`/mis-lotes/${lote.id}/paso/${siguiente}`);
}

module.exports = { getDashboard, getPaso, postPaso };
