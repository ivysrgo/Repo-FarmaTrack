/**
 * src/controllers/LoteController.js
 *
 * Controlador HTTP de Lotes / Órdenes de Producción.
 * Toda la persistencia pasa por LoteRepository — este archivo NO mantiene
 * arrays mock propios.
 */
'use strict';

const loteRepo = require('../repositories/LoteRepository');

// ── Definición de los 9 pasos del proceso ───────────────────────
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

// ── Datos de presentación específicos por paso ──────────────────
// Devuelve los campos que cada vista paso{N}.ejs espera ver, derivados
// del lote real que vive en el repositorio.
function getDatosPaso(lote, paso) {
  const base = {
    pasos: PASOS,
    lote,
    paso,
    nombrePaso: PASOS[paso - 1].nombre,
  };

  const tiempos = ['0m','20m','48m','1h 30m','2h 15m','3h 40m','4h 10m','5h 20m','6h 00m'];
  base.tiempoTranscurrido = tiempos[paso - 1];

  const cantidad = lote.cantidadPlanificada || 0;

  const extras = {
    1: {
      ordenNumero: lote.numeroOrden || `OP-${new Date().getFullYear()}-${String(lote.id).padStart(3,'0')}`,
      producto: lote.producto,
      cantidad: cantidad.toLocaleString('es-CO') + ' unidades',
      fechaInicio: lote.fechaInicio ? new Date(lote.fechaInicio).toLocaleDateString('es-CO') : '—',
      responsable: lote.operario,
      director: lote.directorTecnico || 'David Peña',
      area: lote.area || 'Manufactura sólidos — Línea 2',
      checklist: ['Orden física recibida y en su poder','Datos del sistema coinciden con orden física','Responsable de producción asignado','Observaciones iniciales registradas'],
      observaciones: lote.observaciones || 'Sin observaciones adicionales.',
      eventos: [{ texto:'Paso 1 completado', hora:'08:12', tipo:'ok' },{ texto:'Paso 2 iniciado', hora:'08:14', tipo:'ok' }],
    },
    2: {
      materias: [
        { nombre:'Amoxicilina trihidrato',  esperada:'2,500 g', recibida:'2,500 g', estado:'Conforme' },
        { nombre:'Celulosa microcristalina',esperada:'800 g',   recibida:'800 g',   estado:'Conforme' },
        { nombre:'Almidón de maíz',         esperada:'400 g',   recibida:'400 g',   estado:'Conforme' },
        { nombre:'Estearato de magnesio',    esperada:'20 g',    recibida:'20 g',    estado:'Conforme' },
        { nombre:'Dióxido de silicio',      esperada:'15 g',    recibida:'15 g',    estado:'Conforme' },
      ],
      checklist: ['Todas las MP en laboratorio','Condiciones de transporte OK','Embalajes sin daños','Temperatura verificada'],
      observaciones: 'Todas las materias primas llegaron en buen estado. Temperatura de cadena de frío verificada.',
      eventos: [{ texto:'Paso 2 completado', hora:'08:45', tipo:'ok' },{ texto:'Paso 3 iniciado', hora:'08:47', tipo:'ok' }],
    },
    3: {
      pesos: [
        { nombre:'Amoxicilina trihidrato',  teorico:'500.0', min:'490.0', max:'510.0', registrado:'502.3', resultado:'OK', nota:'' },
        { nombre:'Celulosa microcristalina',teorico:'160.0', min:'155.0', max:'165.0', registrado:'158.1', resultado:'OK', nota:'' },
        { nombre:'Almidón de maíz',         teorico:'80.0',  min:'77.0',  max:'83.0',  registrado:'80.5',  resultado:'OK', nota:'(corregido)' },
        { nombre:'Estearato de magnesio',    teorico:'4.0',   min:'3.8',   max:'4.2',   registrado:'3.9',   resultado:'OK', nota:'' },
        { nombre:'Dióxido de silicio',      teorico:'3.0',   min:'2.8',   max:'3.2',   registrado:'3.0',   resultado:'OK', nota:'' },
      ],
      ncInfo: 'No conformidad registrada y resuelta: Almidón de maíz ajustado de 91.2g → 80.5g. No conformidad NC-2026-003.',
      checklist: ['Balanza calibrada','Pesos registrados','Dentro de BPM','Área limpia'],
      observaciones: 'Se detectó desviación en almidón. Se reportó NC-2026-003, se corrigió el peso y fue aprobado.',
      eventos: [{ texto:'Paso 3 completado', hora:'09:40', tipo:'ok' },{ texto:'NC-2026-003 resuelta', hora:'09:35', tipo:'warning' },{ texto:'Paso 4 iniciado', hora:'09:42', tipo:'ok' }],
    },
    4: {
      instrucciones: [
        { texto:'Verificar que el mezclador esté limpio y habilitado', tipo:'check', valor:'Confirmado' },
        { texto:'Cargar materias primas en el orden indicado en fórmula', tipo:'check', valor:'Confirmado' },
        { texto:'Ajustar temperatura de mezcla al rango 25–30 °C', tipo:'num', valor:'28.2 °C' },
        { texto:'Iniciar mezcla velocidad baja (20 rpm) por 5 minutos', tipo:'num', valor:'20 rpm' },
        { texto:'Aumentar a velocidad media (50 rpm) por 15 minutos', tipo:'num', valor:'50 rpm' },
        { texto:'Registrar hora de inicio de la mezcla final', tipo:'num', valor:'10:18' },
        { texto:'Mantener temperatura de amasado entre 28–32 °C', tipo:'num', valor:'29.4 °C' },
        { texto:'Verificar homogeneidad visual del granulado', tipo:'check', valor:'Confirmado' },
      ],
      checklist: ['Mezclador limpio','Temperatura OK','Todos los pasos','Homogeneidad OK'],
      observaciones: 'Proceso sin novedades. Temperatura estable durante toda la mezcla.',
      eventos: [{ texto:'Paso 4 completado', hora:'11:30', tipo:'ok' },{ texto:'Todos los params OK', hora:'11:28', tipo:'ok' },{ texto:'Paso 5 iniciado', hora:'11:32', tipo:'ok' }],
    },
    5: {
      controles: [
        { parametro:'Pérdida por secado',  especMin:'≤ 3.0 %',    especMax:'3.0 %',     valor:'2.8 %',    resultado:'OK' },
        { parametro:'Tamaño de partícula', especMin:'180 μm',      especMax:'250 μm',    valor:'214 μm',   resultado:'OK' },
        { parametro:'Densidad aparente',   especMin:'0.42 g/mL',   especMax:'0.58 g/mL', valor:'0.44 g/mL',resultado:'OK (ajustado)' },
        { parametro:'pH solución 1%',      especMin:'5.5',         especMax:'6.5',       valor:'6.1',      resultado:'OK' },
        { parametro:'Humedad residual',    especMin:'—',           especMax:'5.0 %',     valor:'3.2 %',    resultado:'OK' },
      ],
      ncInfo: 'NC-2026-004 resuelta: Densidad ajustada tras segunda medición. Reporte de laboratorio adjunto.',
      checklist: ['Controles ejecutados','Laboratorio adjunto','Dentro especificación','Desviaciones OK'],
      observaciones: 'Segunda medición de densidad dio 0.44 g/mL, dentro de especificación. NC-2026-004 cerrada.',
      eventos: [{ texto:'Paso 5 completado', hora:'13:15', tipo:'ok' },{ texto:'Reporte lab recibido', hora:'13:10', tipo:'ok' },{ texto:'Paso 6 iniciado', hora:'13:18', tipo:'ok' }],
    },
    6: {
      cantidadPlanificada: cantidad.toLocaleString('es-CO') + ' unidades',
      producto: lote.producto,
      cantidadObtenida: Math.round(cantidad * 0.97).toLocaleString('es-CO') + ' unidades',
      rendimiento: '97.0%', rendimientoPct: 97,
      horaRetiro: '14:05',
      destino: 'Área de empaque — Mesa 3',
      condicion: 'Conforme — Sin observaciones',
      checklist: ['Producto retirado','Cantidad registrada','Hora anotada','Destino confirmado'],
      observaciones: 'Marmita descargada sin novedades. Rendimiento dentro del umbral mínimo (90%).',
      eventos: [{ texto:'Paso 6 completado', hora:'14:10', tipo:'ok' },{ texto:'Rendimiento 97%', hora:'14:10', tipo:'ok' },{ texto:'Paso 7 iniciado', hora:'14:15', tipo:'ok' }],
    },
    7: {
      tipoEnvase: 'Frasco PET 60ml ámbar',
      loteEnvases: 'ENV-2026-044', loteEtiquetas: 'ETQ-2026-088',
      unidadesPlanificadas: cantidad.toLocaleString('es-CO'),
      unidadesEmpacadas: Math.round(cantidad * 0.966).toLocaleString('es-CO'),
      unidadesDescartadas: '18',
      horaInicio: '14:20', horaFin: '16:45',
      operarioEmpaque: lote.operario,
      controlLinea: [
        { hora:'14:30', revisadas:50, conformes:50, noConformes:0, obs:'Sin observaciones' },
        { hora:'15:00', revisadas:50, conformes:49, noConformes:1, obs:'Tapa suelta — descartada' },
        { hora:'15:30', revisadas:50, conformes:50, noConformes:0, obs:'Sin observaciones' },
        { hora:'16:00', revisadas:50, conformes:48, noConformes:2, obs:'Sellado incompleto x 2' },
      ],
      checklist: ['Tipo envase registrado','Unidades registradas','Control de línea','Horas anotadas'],
      observaciones: '3 unidades descartadas por defecto de empaque. Registradas en control de línea.',
      eventos: [{ texto:'Paso 7 completado', hora:'16:48', tipo:'ok' },{ texto:'Control línea OK', hora:'16:45', tipo:'ok' },{ texto:'Paso 8 iniciado', hora:'16:50', tipo:'ok' }],
    },
    8: {
      horaIngreso: '16:52', operarioArea: lote.operario, codigoArea: 'ÁREA-S01',
      temperatura: '22.4', tempMin: 15, tempMax: 25, tempPct: 48,
      humedad: '48.2', humMin: 40, humMax: 60, humPct: 41,
      condicion: 'Habilitada — Todo conforme',
      checklist: ['Hora de ingreso','Temperatura BPM','Humedad BPM','Área habilitada'],
      observaciones: 'Condiciones ambientales estables. Temperatura y humedad dentro de los rangos BPM.',
      eventos: [{ texto:'Paso 8 completado', hora:'17:22', tipo:'ok' },{ texto:'Condiciones OK', hora:'17:20', tipo:'ok' },{ texto:'Paso 9 iniciado', hora:'17:24', tipo:'ok' }],
    },
    9: {
      unidadesEtiquetadas: Math.round(cantidad * 0.966).toLocaleString('es-CO'),
      checklist: ['Número de lote en etiqueta coincide','Fecha de fabricación correcta','Fecha de vencimiento correcta','Nombre del producto correcto','Concentración correcta','Número de registro sanitario presente'],
      observaciones: 'Etiquetado completado sin novedades. Todas las verificaciones conformes.',
      eventos: [{ texto:'Paso 9 completado', hora:'18:05', tipo:'ok' },{ texto:'Lote marcado como completo', hora:'18:06', tipo:'ok' }],
    },
  };

  return { ...base, ...extras[paso] };
}

// ── Helpers de presentación ─────────────────────────────────────
function buildUsuarioCtx(res) {
  const usuario = res.locals.currentUser || { iniciales: 'DT', nombre: 'Director Técnico' };
  const inic    = usuario.nombre
    ? usuario.nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'DT';
  return { iniciales: inic, nombre: usuario.nombre || 'Director Técnico' };
}

function buildFechaHoy() {
  const ahora = new Date();
  return ahora.toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'short', year: 'numeric',
  }) + ' · ' + ahora.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

// ── Routes handlers ─────────────────────────────────────────────

/** GET /lotes (deprecated, redirige al panel desde el router) */
function getLotesActivos(req, res) {
  return res.redirect('/panel');
}

/** GET /lotes/:id → redirige al paso actual del lote */
function getLoteDetalle(req, res, next) {
  const lote = loteRepo.findById(req.params.id);
  if (!lote) {
    const err = new Error('Lote no encontrado'); err.status = 404; return next(err);
  }
  return res.redirect(`/lotes/${lote.id}/paso/${lote.pasoActual}`);
}

/** GET /lotes/:id/paso/:n → renderiza la vista del paso */
function getPaso(req, res, next) {
  const lote = loteRepo.findById(req.params.id);
  if (!lote) {
    const err = new Error('Lote no encontrado'); err.status = 404; return next(err);
  }
  const n = parseInt(req.params.n, 10);
  if (Number.isNaN(n) || n < 1 || n > 9) {
    return res.redirect(`/lotes/${lote.id}/paso/${lote.pasoActual}`);
  }

  const datos    = getDatosPaso(lote, n);
  const operario = { nombre: lote.operario, iniciales: lote.operarioIniciales };

  res.render(`lotes/paso${n}`, {
    layout:      'layouts/main',
    title:       `Paso ${n}/9 — ${datos.nombrePaso}`,
    currentPath: '/lotes',
    fechaHoy:    buildFechaHoy(),
    usuario:     buildUsuarioCtx(res),
    operario,
    ...datos,
  });
}

/** POST /lotes/:id/paso/:n/avanzar → siguiente paso (placeholder) */
function postPaso(req, res) {
  const lote = loteRepo.findById(req.params.id);
  if (!lote) return res.redirect('/panel');
  const n = parseInt(req.params.n, 10);
  const siguiente = n < 9 ? n + 1 : 9;
  res.redirect(`/lotes/${lote.id}/paso/${siguiente}`);
}

/**
 * POST /lotes/:id/liberar
 *
 * Acción terminal del flujo de producción. El lote llega al paso 9 (etiquetado)
 * completado por el operario; el Director Técnico firma la verificación y lo
 * marca como `liberado`. A partir de aquí el lote sale de los "activos" y entra
 * en el conteo de "liberados este mes" del panel.
 *
 * Reglas:
 *   - Lote debe existir.
 *   - No se puede liberar si ya estaba liberado (mensaje informativo).
 *   - No se puede liberar si fue rechazado.
 *   - Se guarda firma simple (quién y cuándo) en el lote — cuando exista
 *     FirmaRepository esta info se moverá a una colección dedicada.
 */
function liberarLote(req, res, next) {
  const lote = loteRepo.findById(req.params.id);
  if (!lote) {
    const err = new Error('Lote no encontrado'); err.status = 404; return next(err);
  }

  if (lote.estado === 'liberado') {
    req.flash('error', `El lote ${lote.numeroLote} ya estaba liberado.`);
    return res.redirect(`/lotes/${lote.id}/paso/9`);
  }
  if (lote.estado === 'rechazado') {
    req.flash('error', `El lote ${lote.numeroLote} fue rechazado y no puede liberarse.`);
    return res.redirect(`/lotes/${lote.id}/paso/9`);
  }

  // Datos de firma del DT (operario que está logueado, o fallback al DT del lote)
  const usuario  = res.locals.currentUser || {};
  const firmante = usuario.nombre || lote.directorTecnico || 'Director Técnico';
  const ahora    = new Date().toISOString();

  loteRepo.update(lote.id, {
    estado:      'liberado',
    pasoActual:  9,
    liberadoPor: firmante,
    liberadoEn:  ahora,
    fechaFin:    ahora,
  });

  console.log(`[LOTE LIBERADO] ${lote.numeroLote} firmado por ${firmante} en ${ahora}`);

  req.flash('ok', `Lote ${lote.numeroLote} liberado y firmado por ${firmante}.`);

  // Redirigimos al dashboard del rol del usuario logueado:
  //   - operario          → /mis-lotes (verá el lote desaparecer de "activos")
  //   - director_tecnico  → /panel     (verá subir el contador de "liberados")
  const dashPath = (usuario.rol === 'operario') ? '/mis-lotes' : '/panel';
  return res.redirect(dashPath);
}

/** GET /lotes/nuevo → formulario de nueva orden */
function getNuevoLote(req, res) {
  res.render('lotes/nuevo', {
    layout:      'layouts/main',
    title:       'Nueva orden de producción',
    currentPath: '/lotes',
    fechaHoy:    buildFechaHoy(),
    usuario:     buildUsuarioCtx(res),
    errores:     [],
    values:      {},
  });
}

/** POST /lotes/nuevo → crea la orden vía LoteRepository */
function postNuevoLote(req, res) {
  const body = req.body || {};

  // Si el usuario pulsó "Guardar borrador", saltamos validación dura y lo
  // dejamos para una iteración futura — por ahora hacemos un soft redirect.
  if (body.modoBorrador) {
    console.log('[postNuevoLote] Borrador recibido (no persistido):', body.numeroOrden);
    return res.redirect('/panel');
  }

  // ── Validación ────────────────────────────────────────────
  const errores = [];

  if (!body.numeroOrden || !body.numeroOrden.trim())
    errores.push('El número de orden de producción es obligatorio.');
  if (!body.codigoLote || !body.codigoLote.trim())
    errores.push('El código de lote asignado es obligatorio.');
  if (!body.producto || !body.producto.trim())
    errores.push('El producto a fabricar es obligatorio.');

  const cantidad = parseInt(body.cantidad, 10);
  if (!cantidad || cantidad < 100)
    errores.push('La cantidad planificada debe ser un número mayor o igual a 100.');

  if (!body.fechaInicio)
    errores.push('La fecha de inicio planificada es obligatoria.');
  if (!body.operario)
    errores.push('Debes asignar un operario de producción.');
  if (!body.jefeCalidad)
    errores.push('Debes asignar un jefe de calidad.');
  if (!body.area)
    errores.push('Debes seleccionar el área de producción.');

  // Las tres confirmaciones son obligatorias para iniciar la orden
  if (!body.confirmFormula)
    errores.push('Debes confirmar que la fórmula maestra está aprobada y vigente.');
  if (!body.confirmMaterias)
    errores.push('Debes confirmar la disponibilidad de materias primas.');
  if (!body.confirmEquipos)
    errores.push('Debes confirmar que los equipos están habilitados.');

  if (errores.length > 0) {
    return res.status(422).render('lotes/nuevo', {
      layout:      'layouts/main',
      title:       'Nueva orden de producción',
      currentPath: '/lotes',
      fechaHoy:    buildFechaHoy(),
      usuario:     buildUsuarioCtx(res),
      errores,
      values: {
        ...body,
        confirmFormula:  !!body.confirmFormula,
        confirmMaterias: !!body.confirmMaterias,
        confirmEquipos:  !!body.confirmEquipos,
      },
    });
  }

  // ── Persistencia vía repositorio ─────────────────────────
  const nuevo = loteRepo.create({
    numeroOrden:         body.numeroOrden.trim(),
    numeroLote:          body.codigoLote.trim(),
    producto:            body.producto.trim(),
    formaFarmaceutica:   (body.formaFarmaceutica || '').trim(),
    concentracion:       (body.concentracion || '').trim(),
    cantidadPlanificada: cantidad,
    fechaInicio:         new Date(body.fechaInicio).toISOString(),
    fechaFin:            body.fechaFin ? new Date(body.fechaFin).toISOString() : null,
    estado:              'en_espera',
    pasoActual:          1,
    operario:            body.operario,
    jefeCalidad:         body.jefeCalidad,
    directorTecnico:     (body.directorTecnico || '').trim() || (res.locals.currentUser && res.locals.currentUser.nombre) || 'Director Técnico',
    area:                body.area,
    observaciones:       (body.observaciones || '').trim(),
    tiempoTranscurrido:  '0m',
  });

  console.log(`[LOTE CREADO] ${nuevo.numeroLote} — ${nuevo.producto} — Operario: ${nuevo.operario}`);

  // Flash de éxito: el panel lo recoge y lo muestra como banner verde arriba.
  req.flash('ok', `Orden ${nuevo.numeroOrden} creada — lote ${nuevo.numeroLote} (${nuevo.producto}) asignado a ${nuevo.operario}.`);

  // RQF-04 (futuro): generar evento de bitácora aquí cuando exista EventoRepository.
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
