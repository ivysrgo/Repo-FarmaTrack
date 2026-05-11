'use strict';

const LOTES_EJEMPLO = [
  { id: 1, numeroLote: 'FT-2026-0041', medicamento: 'Amoxicilina 500 mg Cáps.', cantidadPlanificada: 50000, operario: 'Carlos Rodríguez', operarioInicial: 'CR', estado: 'en_produccion', pasoActual: 5, fechaInicio: '2026-04-17T06:00:00' },
  { id: 2, numeroLote: 'FT-2026-0042', medicamento: 'Ibuprofeno 400 mg Tab.', cantidadPlanificada: 80000, operario: 'Luisa Martínez', operarioInicial: 'LM', estado: 'bloqueado', pasoActual: 3, fechaInicio: '2026-04-17T07:30:00' },
  { id: 3, numeroLote: 'FT-2026-0043', medicamento: 'Metformina 850 mg Tab.', cantidadPlanificada: 120000, operario: 'Andrés Gómez', operarioInicial: 'AG', estado: 'en_produccion', pasoActual: 2, fechaInicio: '2026-04-18T06:00:00' },
  { id: 4, numeroLote: 'FT-2026-0040', medicamento: 'Loratadina 10 mg Tab.', cantidadPlanificada: 60000, operario: 'María Torres', operarioInicial: 'MT', estado: 'liberado', pasoActual: 9, fechaInicio: '2026-04-16T06:00:00' },
  { id: 5, numeroLote: 'FT-2026-0044', medicamento: 'Enalapril 10 mg Tab.', cantidadPlanificada: 45000, operario: 'Felipe Díaz', operarioInicial: 'FD', estado: 'en_espera', pasoActual: 1, fechaInicio: '2026-04-19T00:00:00' },
];

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

function getDatosPaso(lote, paso) {
  const base = { pasos: PASOS, lote, paso, nombrePaso: PASOS[paso-1].nombre };
  const tiempos = ['0m','20m','48m','1h 30m','2h 15m','3h 40m','4h 10m','5h 20m','6h 00m'];
  base.tiempoTranscurrido = tiempos[paso-1];

  const extras = {
    1: {
      ordenNumero: 'OP-2026-089',
      producto: lote.medicamento,
      cantidad: lote.cantidadPlanificada.toLocaleString('es-CO') + ' unidades',
      fechaInicio: new Date(lote.fechaInicio).toLocaleDateString('es-CO'),
      responsable: lote.operario,
      director: 'David Peña',
      area: 'Manufactura sólidos — Línea 2',
      checklist: ['Orden física recibida y en su poder','Datos del sistema coinciden con orden física','Responsable de producción asignado','Observaciones iniciales registradas'],
      observaciones: 'Sin observaciones adicionales.',
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
      cantidadPlanificada: lote.cantidadPlanificada.toLocaleString('es-CO') + ' unidades',
      producto: lote.medicamento,
      cantidadObtenida: Math.round(lote.cantidadPlanificada * 0.97).toLocaleString('es-CO') + ' unidades',
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
      unidadesPlanificadas: lote.cantidadPlanificada.toLocaleString('es-CO'),
      unidadesEmpacadas: Math.round(lote.cantidadPlanificada * 0.966).toLocaleString('es-CO'),
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
      unidadesEtiquetadas: Math.round(lote.cantidadPlanificada * 0.966).toLocaleString('es-CO'),
      checklist: ['Número de lote en etiqueta coincide','Fecha de fabricación correcta','Fecha de vencimiento correcta','Nombre del producto correcto','Concentración correcta','Número de registro sanitario presente'],
      observaciones: 'Etiquetado completado sin novedades. Todas las verificaciones conformes.',
      eventos: [{ texto:'Paso 9 completado', hora:'18:05', tipo:'ok' },{ texto:'Lote marcado como completo', hora:'18:06', tipo:'ok' }],
    },
  };

  return { ...base, ...extras[paso] };
}

function getLotesActivos(req, res) {
  const { q, estado } = req.query;
  let lotes = [...LOTES_EJEMPLO];
  if (q) { const b = q.toLowerCase(); lotes = lotes.filter(l => l.numeroLote.toLowerCase().includes(b) || l.medicamento.toLowerCase().includes(b) || l.operario.toLowerCase().includes(b)); }
  if (estado) lotes = lotes.filter(l => l.estado === estado);
  const todos = LOTES_EJEMPLO;
  const stats = { enProduccion: todos.filter(l=>l.estado==='en_produccion').length, bloqueados: todos.filter(l=>l.estado==='bloqueado').length, liberadosHoy: todos.filter(l=>l.estado==='liberado').length, total: todos.filter(l=>l.estado!=='rechazado').length };
  const ahora = new Date();
  const fechaHoy = ahora.toLocaleDateString('es-CO',{ weekday:'long', day:'numeric', month:'short', year:'numeric' });
  const usuario = res.locals.currentUser || { iniciales:'DT', nombre:'Director Técnico' };
  const iniciales = usuario.nombre ? usuario.nombre.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() : 'DT';
  res.render('lotes/index', { title:'Lotes Activos', subtitle:'Panel de supervisión — Módulo de Producción', currentPath:'/lotes', lotes, stats, query:q||'', estadoFiltro:estado||'', fechaHoy, usuario:{ iniciales, nombre:usuario.nombre||'Director Técnico' } });
}

function getLoteDetalle(req, res, next) {
  const lote = LOTES_EJEMPLO.find(l => l.id === parseInt(req.params.id));
  if (!lote) { const err = new Error('Lote no encontrado'); err.status = 404; return next(err); }
  res.redirect(`/lotes/${lote.id}/paso/${lote.pasoActual}`);
}

function getPaso(req, res, next) {
  const lote = LOTES_EJEMPLO.find(l => l.id === parseInt(req.params.id));
  if (!lote) { const err = new Error('Lote no encontrado'); err.status = 404; return next(err); }
  const n = parseInt(req.params.n);
  if (n < 1 || n > 9) return res.redirect(`/lotes/${lote.id}/paso/1`);
  const ahora = new Date();
  const fechaHoy = ahora.toLocaleDateString('es-CO',{ weekday:'long', day:'numeric', month:'short', year:'numeric' }) + ' · ' + ahora.toLocaleTimeString('es-CO',{ hour:'2-digit', minute:'2-digit' });
  const usuario = res.locals.currentUser || { iniciales:'DT', nombre:'Director Técnico' };
  const iniciales = usuario.nombre ? usuario.nombre.split(' ').map(x=>x[0]).join('').substring(0,2).toUpperCase() : 'DT';
  const datos = getDatosPaso(lote, n);
  res.render(`lotes/paso${n}`, { layout:'layouts/main', title:`Paso ${n}/9 — ${datos.nombrePaso}`, currentPath:'/lotes', fechaHoy, usuario:{ iniciales, nombre:usuario.nombre||'Director Técnico' }, ...datos });
}

function postPaso(req, res) {
  const id = parseInt(req.params.id);
  const n  = parseInt(req.params.n);
  const siguiente = n < 9 ? n + 1 : 9;
  res.redirect(`/lotes/${id}/paso/${siguiente}`);
}

function getNuevoLote(req, res) {
  const ahora = new Date();
  const fechaHoy =
    ahora.toLocaleDateString('es-CO', {
      weekday: 'long', day: 'numeric', month: 'short', year: 'numeric',
    }) +
    ' · ' +
    ahora.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

  const usuario = res.locals.currentUser || { iniciales: 'DT', nombre: 'Director Técnico' };

  res.render('lotes/nuevo', {
    layout: 'layouts/main',
    title: 'Nueva orden de producción',
    currentPath: '/lotes',
    fechaHoy,
    usuario,
    errores: [],
    values: {},
  });
}

function postNuevoLote(req, res) {
  const { medicamento, cantidadPlanificada, fechaInicio, turno, area, operario, ordenCompra, observaciones } = req.body;

  // Validación de campos obligatorios (RQF-01, RQF-12)
  const errores = [];
  if (!medicamento)                              errores.push('El medicamento es obligatorio.');
  if (!cantidadPlanificada || cantidadPlanificada < 100) errores.push('La cantidad planificada debe ser mayor a 100 unidades.');
  if (!fechaInicio)                              errores.push('La fecha de inicio es obligatoria.');
  if (!turno)                                    errores.push('El turno de producción es obligatorio.');
  if (!area)                                     errores.push('El área de producción es obligatoria.');
  if (!operario)                                 errores.push('El operario asignado es obligatorio.');
  if (!ordenCompra?.trim())                      errores.push('El número de orden de compra es obligatorio.');

  if (errores.length > 0) {
    const ahora = new Date();
    const fechaHoy =
      ahora.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }) +
      ' · ' +
      ahora.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    const usuario = res.locals.currentUser || { iniciales: 'DT', nombre: 'Director Técnico' };

    return res.status(422).render('lotes/nuevo', {
      layout: 'layouts/main',
      title: 'Nueva orden de producción',
      currentPath: '/lotes',
      fechaHoy,
      usuario,
      errores,
      values: req.body,
    });
  }

  
  const anio = new Date().getFullYear();
  const secuencia = String(LOTES_EJEMPLO.length + 1).padStart(4, '0');
  const numeroLote = `FT-${anio}-${secuencia}`;

  // Crear el nuevo lote en memoria (cuando haya MongoDB, aquí va el insert)
  const nuevoLote = {
    id: LOTES_EJEMPLO.length + 1,
    numeroLote,
    medicamento,
    cantidadPlanificada: parseInt(cantidadPlanificada),
    operario,
    operarioInicial: operario.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
    estado: 'en_espera',
    pasoActual: 1,
    fechaInicio: new Date(fechaInicio).toISOString(),
    ordenCompra,
    area,
    turno,
    observaciones: observaciones || '',
  };

  LOTES_EJEMPLO.push(nuevoLote);

  
  console.log(`[LOTE CREADO] ${numeroLote} — ${medicamento} — Operario: ${operario}`);

  
  res.redirect('/lotes');
}


module.exports = { getLotesActivos, getLoteDetalle, getPaso, postPaso, getNuevoLote, postNuevoLote };
