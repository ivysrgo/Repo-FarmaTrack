/**
 * src/controllers/LoteController.js (async)
 */
'use strict';

const loteService = require('../service/LoteService');

const PASOS = [
  { n: 1, nombre: 'Recepcion de la orden' },
  { n: 2, nombre: 'Traslado de materias primas' },
  { n: 3, nombre: 'Verificacion de pesos' },
  { n: 4, nombre: 'Instructivo de manufactura' },
  { n: 5, nombre: 'Controles de calidad' },
  { n: 6, nombre: 'Retiro de marmita' },
  { n: 7, nombre: 'Empaque y tapado' },
  { n: 8, nombre: 'Area de acondicionamiento' },
  { n: 9, nombre: 'Etiquetado' },
];


const CHK_NAMES_POR_PASO = {
  "1": [
    "chk_orden_recibida",
    "chk_datos_coinciden",
    "chk_responsable",
    "chk_observaciones"
  ],
  "2": [
    "chk_mp_laboratorio",
    "chk_transporte",
    "chk_embalajes",
    "chk_temperatura"
  ],
  "3": [
    "chk_balanza",
    "chk_pesos_reg",
    "chk_bpm",
    "chk_area_limpia"
  ],
  "4": [
    "chk_mezclador",
    "chk_temp_ok",
    "chk_pasos_seguidos",
    "chk_homogeneidad"
  ],
  "5": [
    "chk_controles",
    "chk_lab",
    "chk_dentro_espec",
    "chk_desviaciones"
  ],
  "6": [
    "chk_producto_retirado",
    "chk_cantidad",
    "chk_hora",
    "chk_destino"
  ],
  "7": [
    "chk_envase_reg",
    "chk_unidades_reg",
    "chk_control_linea",
    "chk_horas_anotadas"
  ],
  "8": [
    "chk_hora_ingreso",
    "chk_temp_bpm",
    "chk_hum_bpm",
    "chk_area_habilitada"
  ],
  "9": []
};

// Convierte una lista de textos (checklist) en objetos { texto, checked }.
// Lee de `datos` los chk_X correspondientes al paso.
function buildChecklist(textos, paso, datos) {
  const names = CHK_NAMES_POR_PASO[paso] || [];
  return textos.map((texto, i) => ({
    texto,
    checked: !!(datos && names[i] && datos[names[i]] === true),
  }));
}

function getDatosPaso(lote, paso) {
  const base = { pasos: PASOS, lote, paso, nombrePaso: PASOS[paso - 1].nombre };
  const tiempos = ['0m','20m','48m','1h 30m','2h 15m','3h 40m','4h 10m','5h 20m','6h 00m'];
  base.tiempoTranscurrido = tiempos[paso - 1];

  const cantidad = lote.cantidadPlanificada || 0;

  // === Datos llenados por el operario en lote.pasos[paso] (puede no existir) ===
  const datos = (lote.pasos && lote.pasos[paso]) || {};
  const D = (k, fallback = '') => (datos[k] !== undefined && datos[k] !== '') ? datos[k] : fallback;

  // === Estructura de presentación por paso ===
  // Si el operario aún no llenó el paso, devolvemos placeholders vacíos ("—")
  // para que la vista del DT muestre que no hay datos.

  const extras = {
    1: {
      ordenNumero: lote.numeroOrden || `OP-${new Date().getFullYear()}-${String(lote.id).padStart(3,'0')}`,
      producto: lote.producto,
      cantidad: cantidad.toLocaleString('es-CO') + ' unidades',
      fechaInicio: lote.fechaInicio ? new Date(lote.fechaInicio).toLocaleDateString('es-CO') : '—',
      responsable: lote.operario,
      director: lote.directorTecnico || '—',
      area: lote.area || '—',
      checklist: buildChecklist(['Orden fisica recibida','Datos del sistema coinciden','Responsable asignado','Observaciones iniciales registradas'], paso, datos),
      observaciones: D('observaciones', '—'),
      eventos: [],
    },
    2: {
      materias: (datos.materias || []).map(m => ({
        nombre: m.nombre || '—',
        esperada: m.esperada || '—',
        recibida: m.recibida || '—',
        estado: m.estado || '—',
      })),
      checklist: buildChecklist(['Todas las MP en lab','Transporte OK','Embalajes sin danos','Temperatura verificada'], paso, datos),
      observaciones: D('observaciones', '—'),
      eventos: [],
    },
    3: {
      pesos: (datos.pesos || []).map(p => ({
        nombre: p.nombre || '—',
        teorico: p.teorico || '—',
        min: p.min || '—',
        max: p.max || '—',
        registrado: p.registrado || '—',
        resultado: p.resultado || '—',
        nota: p.nota || '',
      })),
      checklist: buildChecklist(['Balanza calibrada','Pesos registrados','Dentro BPM','Area limpia'], paso, datos),
      observaciones: D('observaciones', '—'),
      eventos: [],
    },
    4: {
      instrucciones: [
        { texto:'Temperatura de mezcla (25-30 °C)',  tipo:'num',   valor: D('temp_mezcla') || '—' },
        { texto:'Mezcla velocidad baja (20 rpm)',     tipo:'num',   valor: D('vel_baja') || '—' },
        { texto:'Aumentar a velocidad media (50 rpm)',tipo:'num',   valor: D('vel_media') || '—' },
        { texto:'Hora inicio de mezcla final',        tipo:'num',   valor: D('hora_inicio') || '—' },
        { texto:'Temperatura de amasado (28-32 °C)',  tipo:'num',   valor: D('temp_amasado') || '—' },
        { texto:'Homogeneidad visual del granulado',  tipo:'check', valor: D('homogeneidad') || '—' },
      ],
      checklist: buildChecklist(['Mezclador limpio','Temperatura OK','Todos los pasos','Homogeneidad OK'], paso, datos),
      observaciones: D('observaciones', '—'),
      eventos: [],
    },
    5: {
      controles: (datos.controles || []).map(c => ({
        parametro: c.parametro || '—',
        especMin: c.especMin || '—',
        especMax: c.especMax || '—',
        valor: c.valor || '—',
        resultado: c.resultado || '—',
      })),
      checklist: buildChecklist(['Controles ejecutados','Lab adjunto','Dentro spec','Desviaciones OK'], paso, datos),
      observaciones: D('observaciones', '—'),
      eventos: [],
    },
    6: {
      cantidadPlanificada: cantidad.toLocaleString('es-CO') + ' unidades',
      producto: lote.producto,
      cantidadObtenida: D('cant_obtenida', '—'),
      rendimiento: '—', rendimientoPct: 0,
      horaRetiro: D('hora_retiro', '—'),
      destino: D('destino', '—'),
      condicion: D('condicion', '—'),
      checklist: buildChecklist(['Producto retirado','Cantidad registrada','Hora anotada','Destino confirmado'], paso, datos),
      observaciones: D('observaciones', '—'),
      eventos: [],
    },
    7: {
      tipoEnvase: D('tipo_envase', '—'),
      loteEnvases: D('lote_envases', '—'),
      loteEtiquetas: D('lote_etiquetas', '—'),
      unidadesPlanificadas: cantidad.toLocaleString('es-CO'),
      unidadesEmpacadas: D('unidades_empacadas', '—'),
      unidadesDescartadas: D('unidades_descartadas', '—'),
      horaInicio: D('hora_inicio_emp', '—'),
      horaFin: D('hora_fin_emp', '—'),
      operarioEmpaque: lote.operario,
      controlLinea: [],
      checklist: buildChecklist(['Tipo envase registrado','Unidades registradas','Control de linea','Horas anotadas'], paso, datos),
      observaciones: D('observaciones', '—'),
      eventos: [],
    },
    8: {
      horaIngreso: D('hora_ingreso', '—'),
      operarioArea: lote.operario,
      codigoArea: D('codigo_area', '—'),
      temperatura: D('temp_area', '—'),
      tempMin: 15, tempMax: 25, tempPct: 0,
      humedad: D('humedad_area', '—'),
      humMin: 40, humMax: 60, humPct: 0,
      condicion: D('condicion_area', '—'),
      checklist: buildChecklist(['Hora de ingreso','Temperatura BPM','Humedad BPM','Area habilitada'], paso, datos),
      observaciones: D('observaciones', '—'),
      eventos: [],
    },
    9: {
      unidadesEtiquetadas: D('unidades_etiquetadas', '—'),
      checklist: buildChecklist(['Numero de lote en etiqueta','Fecha de fabricacion','Fecha de vencimiento','Nombre del producto','Concentracion','Registro sanitario'], paso, datos),
      observaciones: D('observaciones', '—'),
      eventos: [],
    },
  };

  return { ...base, ...extras[paso] };
}

function buildUsuarioCtx(res) {
  const usuario = res.locals.currentUser || { iniciales: 'DT', nombre: 'Director Tecnico' };
  const inic = usuario.nombre
    ? usuario.nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'DT';
  return { iniciales: inic, nombre: usuario.nombre || 'Director Tecnico' };
}

function buildFechaHoy() {
  const ahora = new Date();
  return ahora.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })
    + ' · ' + ahora.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

function getLotesActivos(req, res) {
  return res.redirect('/panel');
}

async function getLoteDetalle(req, res, next) {
  const lote = await loteService.findById(req.params.id);
  if (!lote) { const err = new Error('Lote no encontrado'); err.status = 404; return next(err); }
  return res.redirect(`/lotes/${lote.id}/paso/${lote.pasoActual}`);
}

async function getPaso(req, res, next) {
  const lote = await loteService.findById(req.params.id);
  if (!lote) { const err = new Error('Lote no encontrado'); err.status = 404; return next(err); }
  const n = parseInt(req.params.n, 10);
  if (Number.isNaN(n) || n < 1 || n > 9) {
    return res.redirect(`/lotes/${lote.id}/paso/${lote.pasoActual}`);
  }
  const datos = getDatosPaso(lote, n);
  const operario = { nombre: lote.operario, iniciales: lote.operarioIniciales };
  res.render(`lotes/paso${n}`, {
    layout:      'layouts/main',
    title:       `Paso ${n}/9 - ${datos.nombrePaso}`,
    currentPath: '/lotes',
    fechaHoy:    buildFechaHoy(),
    usuario:     buildUsuarioCtx(res),
    operario,
    ...datos,
  });
}

async function postPaso(req, res) {
  const lote = await loteService.findById(req.params.id);
  if (!lote) return res.redirect('/panel');
  const n = parseInt(req.params.n, 10);
  const siguiente = n < 9 ? n + 1 : 9;
  res.redirect(`/lotes/${lote.id}/paso/${siguiente}`);
}

async function liberarLote(req, res, next) {
  const usuario  = res.locals.currentUser || {};
  const firmante = usuario.nombre || 'Director Tecnico';
  const result = await loteService.liberar(req.params.id, firmante);

  if (!result.ok) {
    if (result.code === 'NOT_FOUND') {
      const err = new Error('Lote no encontrado'); err.status = 404; return next(err);
    }
    const lote = await loteService.findById(req.params.id);
    req.flash('error', `El lote ${lote.numeroLote} ${result.code === 'YA_LIBERADO' ? 'ya estaba liberado.' : 'fue rechazado y no puede liberarse.'}`);
    return res.redirect(`/lotes/${lote.id}/paso/9`);
  }

  console.log(`[LOTE LIBERADO] ${result.lote.numeroLote} firmado por ${result.lote.liberadoPor}`);
  req.flash('ok', `Lote ${result.lote.numeroLote} liberado y firmado por ${result.lote.liberadoPor}.`);
  const dashPath = (usuario.rol === 'operario') ? '/mis-lotes' : '/panel';
  return res.redirect(dashPath);
}

async function getNuevoLote(req, res) {
  const { getUsuarioRepo, getMateriaPrimaRepo } = require('../repositories');
  const { FORMULAS, listarProductos } = require('../data/formulas');
  const usuarioRepo = getUsuarioRepo();
  const operarios    = await usuarioRepo.findByRol('operario');
  const jefesCalidad = await usuarioRepo.findByRol('calidad');

  // Catálogo de fórmulas y stock de MPs: la vista usa esto para mostrar el
  // preview de la fórmula seleccionada (qué MPs lleva + estado del stock).
  const productosConFormula = listarProductos();
  const mpRepo  = getMateriaPrimaRepo();
  const materiasPrimas = await mpRepo.findAll();
  const stockMap = {};
  materiasPrimas.forEach(mp => { stockMap[mp.codigo] = { estado: mp.estado, stockKg: mp.stockKg }; });

  res.render('lotes/nuevo', {
    layout:             'layouts/main',
    title:              'Nueva orden de produccion',
    currentPath:        '/lotes',
    fechaHoy:           buildFechaHoy(),
    usuario:            buildUsuarioCtx(res),
    operariosLista:     operarios.map(u => u.nombre),
    jefesCalidadLista:  jefesCalidad.length ? jefesCalidad.map(u => u.nombre) : ['Patricia Henao','Roberto Vega','Sofia Restrepo'],
    productosConFormula,
    formulasJson:       JSON.stringify(FORMULAS),
    stockMapJson:       JSON.stringify(stockMap),
    errores:            [],
    values:             {},
  });
}

async function postNuevoLote(req, res) {
  const body = req.body || {};
  if (body.modoBorrador) {
    console.log('[postNuevoLote] Borrador recibido (no persistido):', body.numeroOrden);
    return res.redirect('/panel');
  }

  const directorFallback = (res.locals.currentUser && res.locals.currentUser.nombre) || 'Director Tecnico';
  const result = await loteService.crearOrden(body, directorFallback);

  if (!result.ok) {
    const { getUsuarioRepo, getMateriaPrimaRepo } = require('../repositories');
    const { FORMULAS, listarProductos } = require('../data/formulas');
    const usuarioRepo = getUsuarioRepo();
    const operarios    = await usuarioRepo.findByRol('operario');
    const jefesCalidad = await usuarioRepo.findByRol('calidad');
    const mpRepo  = getMateriaPrimaRepo();
    const materiasPrimas = await mpRepo.findAll();
    const stockMap = {};
    materiasPrimas.forEach(mp => { stockMap[mp.codigo] = { estado: mp.estado, stockKg: mp.stockKg }; });

    return res.status(422).render('lotes/nuevo', {
      layout:            'layouts/main',
      title:             'Nueva orden de produccion',
      currentPath:       '/lotes',
      fechaHoy:          buildFechaHoy(),
      usuario:           buildUsuarioCtx(res),
      operariosLista:    operarios.map(u => u.nombre),
      jefesCalidadLista: jefesCalidad.length ? jefesCalidad.map(u => u.nombre) : ['Patricia Henao','Roberto Vega','Sofia Restrepo'],
      productosConFormula: listarProductos(),
      formulasJson:        JSON.stringify(FORMULAS),
      stockMapJson:        JSON.stringify(stockMap),
      errores:           result.errores,
      values: {
        ...body,
        confirmFormula:  !!body.confirmFormula,
        confirmMaterias: !!body.confirmMaterias,
        confirmEquipos:  !!body.confirmEquipos,
      },
    });
  }

  console.log(`[LOTE CREADO] ${result.lote.numeroLote} - ${result.lote.producto}`);
  req.flash('ok', `Orden ${result.lote.numeroOrden} creada - lote ${result.lote.numeroLote} asignado a ${result.lote.operario}.`);
  return res.redirect('/panel');
}

module.exports = {
  getLotesActivos,
  getLoteDetalle,
  getPaso,
  postPaso,
  liberarLote,
  getNuevoLote,
  postNuevoLote,
};
