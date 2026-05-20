/**
 * src/controllers/SidebarController.js
 *
 * Maneja las secciones secundarias del sidebar: Batch Records, Control
 * Calidad, Inventario MP, Bitácora, Reportes y Configuración.
 *
 * Diseño:
 *  - Todas las vistas usan `layouts/main` y muestran información REAL
 *    derivada de `LoteRepository` cuando es posible. Lo que aún no tenemos
 *    como entidad propia (materias primas, eventos históricos) se sirve con
 *    mock que está claramente marcado en cada vista.
 *  - Cuando exista MaterialRepository / EventoRepository, las vistas leerán
 *    de esos repos sin cambios en los handlers acá.
 */
'use strict';

const loteRepo = require('../repositories/LoteRepository');

// ── Helpers de presentación ─────────────────────────────────────
function buildFechaHoy() {
  const ahora = new Date();
  return ahora.toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'short', year: 'numeric',
  }) + ' · ' + ahora.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

function buildUsuario(res) {
  const u = res.locals.currentUser || { nombre: 'Usuario', rol: '' };
  const inic = (u.nombre || 'U').split(' ').filter(Boolean).map(n => n[0]).join('').substring(0,2).toUpperCase();
  return { iniciales: inic, nombre: u.nombre || 'Usuario', rol: u.rol || '', email: u.email || '', cargo: u.cargo || '' };
}

function buildCommonCtx(req, res, opts = {}) {
  return {
    layout:      'layouts/main',
    title:       opts.title,
    currentPath: opts.currentPath || req.path,
    fechaHoy:    buildFechaHoy(),
    usuario:     buildUsuario(res),
    flashOk:     req.flash ? req.flash('ok')    : [],
    flashError:  req.flash ? req.flash('error') : [],
  };
}

// ════════════════════════════════════════════════════════════════
// GET /batch-records
// Lista de batch records (lotes liberados). Solo aplica al DT, pero
// dejamos accesible para que cualquier usuario vea el historial.
// ════════════════════════════════════════════════════════════════
function getBatchRecords(req, res) {
  const lotesLiberados = loteRepo.findAll().filter(l => l.estado === 'liberado');
  const counts = loteRepo.stats();
  res.render('sistema/batch-records', {
    ...buildCommonCtx(req, res, { title: 'Batch Records', currentPath: '/batch-records' }),
    lotes: lotesLiberados,
    stats: {
      total:      counts.liberados,
      esteMes:    lotesLiberados.length, // simplificación: todos los del repo
      pendientes: counts.pendientesFirma,
    },
  });
}

// ════════════════════════════════════════════════════════════════
// GET /calidad
// Control de calidad: lotes en estado en_calidad, alerta_bpm, bloqueado.
// ════════════════════════════════════════════════════════════════
function getCalidad(req, res) {
  const all = loteRepo.findAll();
  const enRevision = all.filter(l => l.estado === 'en_calidad');
  const conAlerta  = all.filter(l => l.estado === 'alerta_bpm');
  const bloqueados = all.filter(l => l.estado === 'bloqueado');
  res.render('sistema/calidad', {
    ...buildCommonCtx(req, res, { title: 'Control de calidad', currentPath: '/calidad' }),
    enRevision,
    conAlerta,
    bloqueados,
    stats: {
      enRevision: enRevision.length,
      alertas:    conAlerta.length,
      bloqueados: bloqueados.length,
    },
  });
}

// ════════════════════════════════════════════════════════════════
// GET /inventario
// Inventario de materias primas. Aún no hay MaterialRepository,
// así que servimos un mock claramente marcado.
// ════════════════════════════════════════════════════════════════
function getInventario(req, res) {
  // Mock de materias primas — reemplazar por MaterialRepository.findAll()
  const materias = [
    { codigo: 'MP-001', nombre: 'Amoxicilina trihidrato',  stockKg: 145.2, stockMinKg: 50,  estado: 'ok',        proveedor: 'Quimifarma S.A.' },
    { codigo: 'MP-002', nombre: 'Celulosa microcristalina', stockKg: 320.0, stockMinKg: 80,  estado: 'ok',        proveedor: 'Excipientes Andes' },
    { codigo: 'MP-003', nombre: 'Almidón de maíz',         stockKg: 18.5,  stockMinKg: 30,  estado: 'bajo',      proveedor: 'Granos Industrial' },
    { codigo: 'MP-004', nombre: 'Estearato de magnesio',   stockKg: 12.0,  stockMinKg: 5,   estado: 'ok',        proveedor: 'Excipientes Andes' },
    { codigo: 'MP-005', nombre: 'Dióxido de silicio',      stockKg: 8.3,   stockMinKg: 5,   estado: 'ok',        proveedor: 'Quimifarma S.A.' },
    { codigo: 'MP-006', nombre: 'Lactosa monohidrato',     stockKg: 0,     stockMinKg: 40,  estado: 'agotado',   proveedor: 'Granos Industrial' },
    { codigo: 'MP-007', nombre: 'Povidona K30',            stockKg: 22.5,  stockMinKg: 10,  estado: 'ok',        proveedor: 'Excipientes Andes' },
  ];
  const stats = {
    total:    materias.length,
    bajos:    materias.filter(m => m.estado === 'bajo').length,
    agotados: materias.filter(m => m.estado === 'agotado').length,
  };
  res.render('sistema/inventario', {
    ...buildCommonCtx(req, res, { title: 'Inventario de materias primas', currentPath: '/inventario' }),
    materias,
    stats,
  });
}

// ════════════════════════════════════════════════════════════════
// GET /bitacora
// Bitácora de eventos. Hoy es mock; cuando exista EventoRepository
// se filtra por usuario según rol (operario ve solo los suyos).
// ════════════════════════════════════════════════════════════════
function getBitacora(req, res) {
  const usuario = res.locals.currentUser || {};
  const esOperario = usuario.rol === 'operario';

  // Mock — luego viene de EventoRepository.findAll({ usuario, desde, hasta })
  let eventos = [
    { tipo: 'ok',      fecha: '2026-04-19 10:15', usuario: 'Carlos Rodríguez', texto: 'FT-2026-0041 · Paso 5 iniciado',                  lote: 'FT-2026-0041' },
    { tipo: 'warning', fecha: '2026-04-19 09:42', usuario: 'Sistema',           texto: 'FT-2026-0042 · Lote pendiente de verificación',  lote: 'FT-2026-0042' },
    { tipo: 'alert',   fecha: '2026-04-19 08:30', usuario: 'Sistema',           texto: 'FT-2026-0044 · Alerta BPM — temperatura fuera de rango', lote: 'FT-2026-0044' },
    { tipo: 'info',    fecha: '2026-04-18 18:06', usuario: 'David Peña',        texto: 'FT-2026-0040 · Batch record generado',           lote: 'FT-2026-0040' },
    { tipo: 'ok',      fecha: '2026-04-18 16:48', usuario: 'María Torres',      texto: 'FT-2026-0040 · Paso 9 completado y notificado al DT', lote: 'FT-2026-0040' },
    { tipo: 'ok',      fecha: '2026-04-18 13:15', usuario: 'Andrés Gómez',      texto: 'FT-2026-0043 · Paso 5 completado',               lote: 'FT-2026-0043' },
    { tipo: 'ok',      fecha: '2026-04-18 09:40', usuario: 'Luisa Martínez',    texto: 'FT-2026-0042 · Paso 3 completado',               lote: 'FT-2026-0042' },
    { tipo: 'warning', fecha: '2026-04-18 09:35', usuario: 'Sistema',           texto: 'FT-2026-0042 · NC-2026-003 abierta',             lote: 'FT-2026-0042' },
    { tipo: 'ok',      fecha: '2026-04-17 14:10', usuario: 'Carlos Rodríguez',  texto: 'FT-2026-0041 · Paso 6 completado, rendimiento 97%', lote: 'FT-2026-0041' },
  ];

  // Si es operario, filtramos por su nombre (caso real cuando Mongo tenga la asignación)
  if (esOperario && usuario.nombre) {
    eventos = eventos.filter(e => e.usuario === usuario.nombre || e.usuario === 'Sistema');
  }

  res.render('sistema/bitacora', {
    ...buildCommonCtx(req, res, { title: 'Bitácora', currentPath: '/bitacora' }),
    eventos,
    esOperario,
  });
}

// ════════════════════════════════════════════════════════════════
// GET /reportes
// Reportes disponibles. Página de entrada con cards por tipo de reporte.
// ════════════════════════════════════════════════════════════════
function getReportes(req, res) {
  const counts = loteRepo.stats();
  const reportes = [
    {
      titulo:      'Reporte mensual de producción',
      descripcion: 'Lotes iniciados, completados y liberados en el mes en curso, con tasa de cumplimiento BPM.',
      meta:        `${counts.total} lotes en el periodo`,
      icono:       '📊',
    },
    {
      titulo:      'Reporte de no conformidades',
      descripcion: 'NC abiertas, en seguimiento y cerradas del mes, con tiempo promedio de resolución.',
      meta:        `${counts.alertasBPM + counts.bloqueados} con alertas activas`,
      icono:       '⚠️',
    },
    {
      titulo:      'Cumplimiento BPM',
      descripcion: 'Tasa de adherencia a Buenas Prácticas de Manufactura, calculada sobre los pasos de los lotes liberados.',
      meta:        '94 % este mes',
      icono:       '✓',
    },
    {
      titulo:      'Batch records firmados',
      descripcion: 'Lista exportable de batch records con firma electrónica del Director Técnico.',
      meta:        `${counts.liberados} liberados`,
      icono:       '📄',
    },
  ];
  res.render('sistema/reportes', {
    ...buildCommonCtx(req, res, { title: 'Reportes', currentPath: '/reportes' }),
    reportes,
  });
}

// ════════════════════════════════════════════════════════════════
// GET /configuracion
// Perfil del usuario logueado + información del sistema.
// ════════════════════════════════════════════════════════════════
function getConfiguracion(req, res) {
  const u = res.locals.currentUser || {};
  const rolesLabel = {
    director_tecnico: 'Director Técnico',
    operario:         'Operario de Producción',
    calidad:          'Analista de Calidad',
  };
  res.render('sistema/configuracion', {
    ...buildCommonCtx(req, res, { title: 'Configuración', currentPath: '/configuracion' }),
    perfil: {
      nombre:    u.nombre || 'Usuario',
      email:     u.email  || '—',
      rolLabel:  rolesLabel[u.rol] || u.rol || 'Usuario',
      cargo:     u.cargo  || '—',
    },
    sistema: {
      app:      'FarmaTrack',
      version:  '1.0.0',
      entorno:  process.env.NODE_ENV || 'development',
    },
  });
}

module.exports = {
  getBatchRecords,
  getCalidad,
  getInventario,
  getBitacora,
  getReportes,
  getConfiguracion,
};
