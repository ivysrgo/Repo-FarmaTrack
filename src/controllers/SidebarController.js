/**
 * src/controllers/SidebarController.js (async)
 */
'use strict';

const loteService = require('../service/LoteService');

function buildFechaHoy() {
  const ahora = new Date();
  return ahora.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })
    + ' · ' + ahora.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
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

async function getBatchRecords(req, res) {
  const all = await loteService.findAll();
  const lotesLiberados = all.filter(l => l.estado === 'liberado');
  const counts = await loteService.stats();
  res.render('sistema/batch-records', {
    ...buildCommonCtx(req, res, { title: 'Batch Records', currentPath: '/batch-records' }),
    lotes: lotesLiberados,
    stats: {
      total:      counts.liberados,
      esteMes:    lotesLiberados.length,
      pendientes: counts.pendientesFirma,
    },
  });
}

async function getCalidad(req, res) {
  const all = await loteService.findAll();
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

async function getInventario(req, res) {
  // Antes los 7 MPs estaban hardcodeados aquí. Ahora vienen del repo
  // (Mongo o memoria, según composition root). El campo `estado` se
  // calcula en el repo a partir de stockKg vs stockMinKg, así que la
  // vista no necesita hacer nada.
  const { getMateriaPrimaRepo } = require('../repositories');
  const mpRepo  = getMateriaPrimaRepo();
  const materias = await mpRepo.findAll();
  const stats    = await mpRepo.stats();
  res.render('sistema/inventario', {
    ...buildCommonCtx(req, res, { title: 'Inventario de materias primas', currentPath: '/inventario' }),
    materias, stats,
  });
}

// Mapa de tipo de evento (modelo Evento) → tipo visual (vista bitacora)
const VISUAL_POR_TIPO = {
  lote_creado:          'info',
  paso_completado:      'ok',
  lote_pendiente_firma: 'warning',
  lote_liberado:        'ok',
  nc_reportada:         'warning',
  lote_alerta_bpm:      'alert',
};

async function getBitacora(req, res) {
  const usuario = res.locals.currentUser || {};
  const esOperario = usuario.rol === 'operario';

  const eventoService = require('../service/EventoService');
  const ncService     = require('../service/NoConformidadService');
  const eventosRaw    = await eventoService.listar({ limit: 50 });

  // Construir índice de NCs por id para saber cuáles siguen abiertas.
  // Cualquier evento de tipo 'nc_reportada' con meta.ncId podrá mostrar
  // botón "Marcar resuelta" si la NC sigue sin resolver.
  const ncs = await ncService.listar({});
  const ncPorId = new Map();
  ncs.forEach(nc => { ncPorId.set(String(nc.id || nc._id), nc); });

  // Transformar al formato que espera la vista. Incluimos loteId (ObjectId)
  // para que la vista pueda construir el link correcto a /lotes/:id.
  let eventos = eventosRaw.map(e => {
    const meta = e.meta || {};
    const paso = (typeof meta.paso === 'number' && meta.paso >= 1 && meta.paso <= 9) ? meta.paso : null;
    const ncId = meta.ncId ? String(meta.ncId) : null;

    // Si el evento es NC reportada y aún tenemos la NC en repo, decidir si se puede resolver.
    let puedeResolver = false;
    if (e.tipo === 'nc_reportada' && ncId) {
      const nc = ncPorId.get(ncId);
      if (nc && !nc.resuelta) puedeResolver = true;
    }

    // Link al lote: si hay paso, ir directo a /lotes/:id/paso/:n; si no, a /lotes/:id
    let loteHref = null;
    if (e.loteId) {
      loteHref = paso
        ? `/lotes/${String(e.loteId)}/paso/${paso}`
        : `/lotes/${String(e.loteId)}`;
    }

    return {
      tipo:    VISUAL_POR_TIPO[e.tipo] || 'info',
      tipoRaw: e.tipo,
      fecha:   new Date(e.createdAt).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }),
      loteId:  e.loteId ? String(e.loteId) : null,
      loteHref,
      paso,
      ncId,
      puedeResolver,
      usuario: e.usuario,
      texto:   e.texto,
      lote:    e.loteNumero || '',
    };
  });

  // Si es operario, filtrar solo sus eventos y los del sistema
  if (esOperario && usuario.nombre) {
    eventos = eventos.filter(e => e.usuario === usuario.nombre || e.usuario === 'Sistema');
  }

  // Los operarios NO ven el botón "Marcar resuelta" — sólo el DT.
  if (esOperario) {
    eventos.forEach(e => { e.puedeResolver = false; });
  }

  res.render('sistema/bitacora', {
    ...buildCommonCtx(req, res, { title: 'Bitacora', currentPath: '/bitacora' }),
    eventos, esOperario,
  });
}

async function getReportes(req, res) {
  const counts = await loteService.stats();
  const reportes = [
    { titulo: 'Reporte mensual de produccion', descripcion: 'Lotes iniciados, completados y liberados en el mes en curso, con tasa de cumplimiento BPM.', meta: `${counts.total} lotes en el periodo`, icono: '📊' },
    { titulo: 'Reporte de no conformidades',   descripcion: 'NC abiertas, en seguimiento y cerradas del mes, con tiempo promedio de resolucion.', meta: `${counts.alertasBPM + counts.bloqueados} con alertas activas`, icono: '⚠️' },
    { titulo: 'Cumplimiento BPM',              descripcion: 'Tasa de adherencia a Buenas Practicas de Manufactura, calculada sobre los pasos de los lotes liberados.', meta: '94 % este mes', icono: '✓' },
    { titulo: 'Batch records firmados',        descripcion: 'Lista exportable de batch records con firma electronica del Director Tecnico.', meta: `${counts.liberados} liberados`, icono: '📄' },
  ];
  res.render('sistema/reportes', {
    ...buildCommonCtx(req, res, { title: 'Reportes', currentPath: '/reportes' }),
    reportes,
  });
}

function getConfiguracion(req, res) {
  const u = res.locals.currentUser || {};
  const rolesLabel = {
    director_tecnico: 'Director Tecnico',
    operario:         'Operario de Produccion',
    calidad:          'Analista de Calidad',
  };
  res.render('sistema/configuracion', {
    ...buildCommonCtx(req, res, { title: 'Configuracion', currentPath: '/configuracion' }),
    perfil: {
      nombre:    u.nombre || 'Usuario',
      email:     u.email  || '-',
      rolLabel:  rolesLabel[u.rol] || u.rol || 'Usuario',
      cargo:     u.cargo  || '-',
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
