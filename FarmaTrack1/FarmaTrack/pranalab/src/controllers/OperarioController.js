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
  const todos     = loteRepo.findAll();
  let misLotes    = todos.filter(l => (l.operario || '').toLowerCase() === nombre.toLowerCase());

  // Modo demo: si el usuario logueado no tiene lotes asignados, mostramos
  // los primeros lotes activos del repo para que la pantalla no salga vacía.
  // Cuando la asignación venga de MongoDB esto desaparece.
  let modoDemo = false;
  if (misLotes.length === 0) {
    modoDemo = true;
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
    modoDemo,
  });
}

module.exports = { getDashboard };
