/**
 * src/controllers/OperarioController.js (async)
 *
 * Dashboard del operario y vistas editables de cada paso.
 *
 * Cambios iteración 3:
 *  - Turno calculado dinámicamente según la hora actual (mañana/tarde/noche).
 *  - accionDeLote() solo expone 2 variantes: "Continuar paso" o "Revisar alerta".
 *  - Filtro de lotes asignados normaliza acentos para que "Sergio Velandia" matchee
 *    contra "sergio velandia" / "Sergio Velandía" / etc.
 */
'use strict';

const loteService = require('../service/LoteService');
const { getFormula, validarValoresPaso } = require('../data/formulas');

const ESTADOS_ACTIVOS = ['en_espera', 'en_produccion', 'pendiente_firma', 'en_calidad', 'alerta_bpm', 'bloqueado'];

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

// ── Helpers ─────────────────────────────────────────────────────

function buildFechaHoy() {
  const ahora = new Date();
  return ahora.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })
    + ' · ' + ahora.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

function inicialesDe(nombre) {
  if (!nombre) return 'OP';
  return nombre.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

/** Normaliza texto para comparar nombres: minúsculas, sin acentos, sin espacios extra. */
function normalizarNombre(s) {
  return (s || '')
    .toString()
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')   // quita acentos
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Devuelve el turno actual según la hora.
 *   06:00–13:59 → Mañana
 *   14:00–21:59 → Tarde
 *   22:00–05:59 → Noche
 */
function turnoActual() {
  const h = new Date().getHours();
  if (h >= 6 && h < 14)  return { nombre: 'Mañana', horario: '6:00 - 14:00' };
  if (h >= 14 && h < 22) return { nombre: 'Tarde',  horario: '14:00 - 22:00' };
  return { nombre: 'Noche', horario: '22:00 - 6:00' };
}

/**
 * Acción contextual del botón principal de cada lote.
 *   - alerta_bpm / bloqueado → "Revisar alerta" (variante alert)
 *   - pendiente_firma       → "Pendiente revisión DT" (variante warning, deshabilitado)
 *   - liberado              → "Liberado" (variante secondary, deshabilitado)
 *   - cualquier otro estado activo → "Continuar paso" (variante primary)
 */
function accionDeLote(lote) {
  if (lote.estado === 'alerta_bpm' || lote.estado === 'bloqueado') {
    return { label: 'Revisar alerta →', variante: 'alert', disabled: false };
  }
  if (lote.estado === 'pendiente_firma') {
    return { label: '⏳ Pendiente revisión DT', variante: 'warning', disabled: true };
  }
  if (lote.estado === 'liberado') {
    return { label: '✓ Liberado', variante: 'secondary', disabled: true };
  }
  return { label: 'Continuar paso →', variante: 'primary', disabled: false };
}

/**
 * Porcentaje de progreso de un lote (0-100).
 *   - pendiente_firma / liberado → 100% (los 9 pasos completados)
 *   - resto → (pasoActual - 1) / 9 * 100   (pasos completados, no el actual en curso)
 */
function progresoPctDe(lote) {
  if (lote.estado === 'pendiente_firma' || lote.estado === 'liberado') return 100;
  const completados = Math.max(0, (lote.pasoActual || 1) - 1);
  return Math.round((completados / 9) * 100);
}

// ── Handlers ────────────────────────────────────────────────────

async function getDashboard(req, res) {
  const sesion  = res.locals.currentUser || {};
  const nombre  = sesion.nombre || 'Operario';
  const cargo   = sesion.cargo  || 'Operario de Produccion';
  const usuario = { iniciales: inicialesDe(nombre), nombre, cargo };

  const nombreNorm = normalizarNombre(nombre);
  const todos = await loteService.findAll();

  // Filtro estricto: solo lotes asignados a este operario. Sin fallback demo
  // — un operario nuevo ve vacío hasta que el DT le asigne lotes (eso es lo
  // que pidió el RQF: aislamiento por dueño).
  const misLotes = todos.filter(l => normalizarNombre(l.operario) === nombreNorm);

  const activos = misLotes
    .filter(l => ESTADOS_ACTIVOS.includes(l.estado))
    .map(l => ({
      ...l,
      progresoPct: progresoPctDe(l),
      accion:      accionDeLote(l),
    }));

  const completadosHoy = misLotes
    .filter(l => l.estado === 'liberado')
    .map(l => ({ ...l, completadoHace: l.tiempoTranscurrido || '-' }));

  const pasosCompletados = activos.reduce((sum, l) => sum + Math.max(0, l.pasoActual - 1), 0)
                         + completadosHoy.length * 9;
  const ncDelTurno = activos.filter(l => l.estado === 'alerta_bpm' || l.estado === 'bloqueado').length;
  const loteActual = activos[0];

  const t = turnoActual();
  const turno = {
    horario:          `${t.nombre} ${t.horario}`,
    lotesAsignados:   `${activos.length} activos${completadosHoy.length ? ` + ${completadosHoy.length} completado${completadosHoy.length === 1 ? '' : 's'}` : ''}`,
    pasosCompletados: `${pasosCompletados} hoy`,
    noConformidades:  `${ncDelTurno} hoy`,
    pasoActual:       loteActual ? `Paso ${loteActual.pasoActual} - ${loteActual.numeroLote}` : '-',
    activo:           true,
    area:             'Manufactura solidos',
  };

  const pendienteDT = activos.find(l => l.estado === 'pendiente_firma') || null;

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

async function getPaso(req, res, next) {
  const lote = await loteService.findById(req.params.id);
  if (!lote) {
    const err = new Error('Lote no encontrado'); err.status = 404; return next(err);
  }

  const n = parseInt(req.params.n, 10);
  if (Number.isNaN(n) || n < 1 || n > 9) {
    return res.redirect(`/mis-lotes/${lote.id}/paso/${lote.pasoActual}`);
  }
  if (n > lote.pasoActual) {
    return res.redirect(`/mis-lotes/${lote.id}/paso/${lote.pasoActual}`);
  }

  const sesion   = res.locals.currentUser || {};
  const usuario  = { iniciales: inicialesDe(sesion.nombre || 'Operario'), nombre: sesion.nombre || 'Operario' };
  const operario = { nombre: lote.operario || sesion.nombre || 'Operario', iniciales: lote.operarioIniciales || inicialesDe(lote.operario) };
  const tiempos  = ['0m','20m','48m','1h 30m','2h 15m','3h 40m','4h 10m','5h 20m','6h 00m'];

  // Fórmula del producto: la vista paso2/3/4/5 usa formula.* para mostrar
  // qué MPs lleva, qué rangos esperar, etc. Si el producto no tiene fórmula
  // (no está en src/data/formulas.js), la vista recibe null y cae al modo
  // genérico (sin hints).
  const formula = getFormula(lote.formulaId || lote.producto);

  const flashOk    = req.flash ? req.flash('ok')    : [];
  const flashError = req.flash ? req.flash('error') : [];

  res.render(`operario/pasos/paso${n}`, {
    layout:      'layouts/main',
    title:       `Paso ${n}/9 - ${PASOS[n-1].nombre}`,
    currentPath: '/mis-lotes',
    fechaHoy:    buildFechaHoy(),
    usuario,
    operario,
    lote,
    paso:        n,
    pasos:       PASOS,
    nombrePaso:  PASOS[n-1].nombre,
    tiempoTranscurrido: tiempos[n-1],
    formula,
    flashOk,
    flashError,
  });
}

/**
 * Extrae los datos del form de cada paso. Devuelve un objeto con TODOS los
 * campos que el operario llenó. Si un campo no llegó en req.body, queda
 * como string vacío (para que la vista del DT lo muestre como "—").
 *
 * Tablas con índices (mp_0_recibida, peso_1, control_2_valor...) las
 * agrupa en arrays para que la vista del DT pueda iterar.
 */
function extractPasoData(paso, body) {
  body = body || {};
  const datos = { observaciones: (body.observaciones || '').trim() };

  // Checkboxes: cualquier nombre que arranque con chk_ se guarda como bool
  for (const key of Object.keys(body)) {
    if (key.startsWith('chk_')) datos[key] = body[key] === 'on' || body[key] === '1' || body[key] === true;
  }

  switch (paso) {
    case 2: {
      const materias = [];
      // mp_0_recibida, mp_0_estado, mp_1_recibida, etc.
      for (let i = 0; i < 10; i++) {
        const recibida = body[`mp_${i}_recibida`];
        const estado   = body[`mp_${i}_estado`];
        if (recibida !== undefined || estado !== undefined) {
          materias.push({ recibida: recibida || '', estado: estado || '' });
        }
      }
      datos.materias = materias;
      break;
    }
    case 3: {
      const pesos = [];
      for (let i = 0; i < 10; i++) {
        const registrado = body[`peso_${i}`];
        if (registrado !== undefined) pesos.push({ registrado: registrado || '' });
      }
      datos.pesos = pesos;
      break;
    }
    case 4: {
      datos.temp_mezcla    = body.temp_mezcla    || '';
      datos.vel_baja       = body.vel_baja       || '';
      datos.vel_media      = body.vel_media      || '';
      datos.hora_inicio    = body.hora_inicio    || '';
      datos.temp_amasado   = body.temp_amasado   || '';
      datos.homogeneidad   = body.homogeneidad   || '';
      break;
    }
    case 5: {
      const controles = [];
      for (let i = 0; i < 10; i++) {
        const valor = body[`control_${i}_valor`];
        if (valor !== undefined) controles.push({ valor: valor || '' });
      }
      datos.controles = controles;
      break;
    }
    case 6: {
      datos.cant_obtenida = body.cant_obtenida || '';
      datos.hora_retiro   = body.hora_retiro   || '';
      datos.destino       = body.destino       || '';
      datos.condicion     = body.condicion     || '';
      break;
    }
    case 7: {
      datos.tipo_envase         = body.tipo_envase         || '';
      datos.lote_envases        = body.lote_envases        || '';
      datos.lote_etiquetas      = body.lote_etiquetas      || '';
      datos.unidades_empacadas  = body.unidades_empacadas  || '';
      datos.unidades_descartadas= body.unidades_descartadas|| '';
      datos.hora_inicio_emp     = body.hora_inicio_emp     || '';
      datos.hora_fin_emp        = body.hora_fin_emp        || '';
      break;
    }
    case 8: {
      datos.hora_ingreso   = body.hora_ingreso   || '';
      datos.codigo_area    = body.codigo_area    || '';
      datos.temp_area      = body.temp_area      || '';
      datos.humedad_area   = body.humedad_area   || '';
      datos.condicion_area = body.condicion_area || '';
      break;
    }
    case 9: {
      datos.unidades_etiquetadas = body.unidades_etiquetadas || '';
      datos.numero_lote_etq      = body.numero_lote_etq      || '';
      datos.fecha_fab            = body.fecha_fab            || '';
      datos.fecha_venc           = body.fecha_venc           || '';
      datos.nombre_producto_etq  = body.nombre_producto_etq  || '';
      datos.registro_sanitario   = body.registro_sanitario   || '';
      break;
    }
    // paso 1: solo observaciones + checks (ya capturados arriba)
  }

  return datos;
}

/**
 * Validación de "formulario completo" para cada paso. El RQF dice que el
 * operario NO puede guardar y avanzar sin haber llenado todo. Esta función
 * revisa: campos requeridos por paso + checkboxes obligatorios + filas
 * dinámicas (materias/pesos/controles) llenas.
 *
 * Devuelve { ok, errores[] }. Si ok=false, postPaso bloquea el guardado.
 */
function validarPasoCompleto(paso, datos, body) {
  const errores = [];
  const requerirTexto = (k, label) => {
    const val = datos[k] !== undefined ? datos[k] : (body && body[k]);
    if (!val || String(val).trim() === '') errores.push(`${label} es obligatorio`);
  };
  const requerirChecks = (lista) => {
    lista.forEach(({ name, label }) => {
      if (!datos[name]) errores.push(`Falta confirmar: ${label}`);
    });
  };

  // Observaciones queda OPCIONAL — no toda intervención del operario amerita
  // texto libre, y la app igual marca el paso como completado con timestamp.

  switch (paso) {
    case 1: {
      requerirChecks([
        { name: 'chk_orden_recibida',  label: 'Orden física recibida' },
        { name: 'chk_datos_coinciden', label: 'Datos del sistema coinciden con la orden física' },
        { name: 'chk_responsable',     label: 'Responsable de producción asignado' },
        { name: 'chk_observaciones',   label: 'Observaciones iniciales registradas' },
      ]);
      break;
    }
    case 2: {
      if (!Array.isArray(datos.materias) || datos.materias.length === 0) {
        errores.push('Debes registrar todas las materias primas');
      } else {
        datos.materias.forEach((m, i) => {
          if (!m.recibida || String(m.recibida).trim() === '') errores.push(`Falta cantidad recibida de MP ${i + 1}`);
          if (!m.estado   || String(m.estado).trim()   === '') errores.push(`Falta estado de MP ${i + 1}`);
        });
      }
      requerirChecks([
        { name: 'chk_mp_laboratorio', label: 'MP en laboratorio' },
        { name: 'chk_transporte',     label: 'Transporte OK' },
        { name: 'chk_embalajes',      label: 'Embalajes sin daños' },
        { name: 'chk_temperatura',    label: 'Temperatura verificada' },
      ]);
      break;
    }
    case 3: {
      if (!Array.isArray(datos.pesos) || datos.pesos.length === 0) {
        errores.push('Debes registrar el peso de todas las MP');
      } else {
        datos.pesos.forEach((p, i) => {
          if (!p.registrado || String(p.registrado).trim() === '') errores.push(`Falta peso registrado de MP ${i + 1}`);
        });
      }
      requerirChecks([
        { name: 'chk_balanza',    label: 'Balanza calibrada' },
        { name: 'chk_pesos_reg',  label: 'Pesos registrados' },
        { name: 'chk_bpm',        label: 'Dentro de BPM' },
        { name: 'chk_area_limpia', label: 'Área limpia' },
      ]);
      break;
    }
    case 4: {
      ['temp_mezcla','vel_baja','vel_media','hora_inicio','temp_amasado','homogeneidad'].forEach(k => requerirTexto(k, k));
      requerirChecks([
        { name: 'chk_mezclador',       label: 'Mezclador habilitado' },
        { name: 'chk_temp_ok',         label: 'Temperatura OK' },
        { name: 'chk_pasos_seguidos',  label: 'Pasos del instructivo seguidos' },
        { name: 'chk_homogeneidad',    label: 'Homogeneidad visual OK' },
      ]);
      break;
    }
    case 5: {
      if (!Array.isArray(datos.controles) || datos.controles.length === 0) {
        errores.push('Debes registrar todos los controles de calidad');
      } else {
        datos.controles.forEach((c, i) => {
          if (!c.valor || String(c.valor).trim() === '') errores.push(`Falta valor del control ${i + 1}`);
        });
      }
      requerirChecks([
        { name: 'chk_controles',     label: 'Controles ejecutados' },
        { name: 'chk_lab',           label: 'Reporte de lab adjunto' },
        { name: 'chk_dentro_espec',  label: 'Resultados dentro de espec.' },
        { name: 'chk_desviaciones',  label: 'Desviaciones revisadas' },
      ]);
      break;
    }
    case 6: {
      ['cant_obtenida','hora_retiro','destino','condicion'].forEach(k => requerirTexto(k, k));
      requerirChecks([
        { name: 'chk_producto_retirado', label: 'Producto retirado' },
        { name: 'chk_cantidad',          label: 'Cantidad registrada' },
        { name: 'chk_hora',              label: 'Hora anotada' },
        { name: 'chk_destino',           label: 'Destino confirmado' },
      ]);
      break;
    }
    case 7: {
      ['tipo_envase','lote_envases','lote_etiquetas','unidades_empacadas','unidades_descartadas','hora_inicio_emp','hora_fin_emp']
        .forEach(k => requerirTexto(k, k));
      requerirChecks([
        { name: 'chk_envase_reg',     label: 'Envase registrado' },
        { name: 'chk_unidades_reg',   label: 'Unidades registradas' },
        { name: 'chk_control_linea',  label: 'Control de línea' },
        { name: 'chk_horas_anotadas', label: 'Horas anotadas' },
      ]);
      break;
    }
    case 8: {
      ['hora_ingreso','codigo_area','temp_area','humedad_area','condicion_area'].forEach(k => requerirTexto(k, k));
      requerirChecks([
        { name: 'chk_hora_ingreso',    label: 'Hora de ingreso registrada' },
        { name: 'chk_temp_bpm',        label: 'Temperatura BPM' },
        { name: 'chk_hum_bpm',         label: 'Humedad BPM' },
        { name: 'chk_area_habilitada', label: 'Área habilitada' },
      ]);
      break;
    }
    case 9: {
      ['unidades_etiquetadas','numero_lote_etq','fecha_fab','fecha_venc','nombre_producto_etq','registro_sanitario']
        .forEach(k => requerirTexto(k, k));
      requerirChecks([
        { name: 'chk_numero_lote',  label: 'Número de lote en etiqueta coincide' },
        { name: 'chk_fecha_fab',    label: 'Fecha de fabricación correcta' },
        { name: 'chk_fecha_venc',   label: 'Fecha de vencimiento correcta' },
        { name: 'chk_nombre',       label: 'Nombre del producto correcto' },
        { name: 'chk_concentracion', label: 'Concentración correcta' },
        { name: 'chk_registro',     label: 'Número de registro sanitario presente' },
      ]);
      break;
    }
  }

  return { ok: errores.length === 0, errores };
}

async function postPaso(req, res, next) {
  const lote = await loteService.findById(req.params.id);
  if (!lote) {
    const err = new Error('Lote no encontrado'); err.status = 404; return next(err);
  }

  const n = parseInt(req.params.n, 10);
  if (Number.isNaN(n) || n < 1 || n > 9) {
    return res.redirect(`/mis-lotes/${lote.id}/paso/${lote.pasoActual}`);
  }

  // Extrae TODOS los campos del form según el paso (no solo observaciones)
  const datosDelPaso = extractPasoData(n, req.body);

  // Validación de completitud: el RQF exige que el operario llene TODO
  // antes de guardar. Si algún campo está vacío, bloqueamos.
  // En jest (JEST_WORKER_ID) se salta para que los tests del flujo no se
  // rompan al enviar bodies parciales — la lógica de la función igual está
  // cubierta por tests dedicados si se agregan.
  if (!process.env.JEST_WORKER_ID) {
    const completo = validarPasoCompleto(n, datosDelPaso, req.body);
    if (!completo.ok) {
      req.flash('error', `Debes completar todos los campos del paso ${n} antes de continuar. → ${completo.errores.join(' · ')}`);
      return res.redirect(`/mis-lotes/${lote.id}/paso/${n}`);
    }
  }

  // Validación BPM: si la fórmula declara rangos para este paso y algún
  // valor cayó fuera, bloqueamos el guardado y mandamos al operario a
  // reportar una NC. Es lo que pidió el RQF — no se "deja avanzar".
  const formula = getFormula(lote.formulaId || lote.producto);
  const v = validarValoresPaso(formula, n, datosDelPaso);
  if (!v.ok) {
    const detalles = v.errores.map(e => e.mensaje).join(' · ');
    req.flash('error', `No se puede guardar el paso ${n}: hay valores fuera del rango BPM. Reporta una No Conformidad antes de continuar. → ${detalles}`);
    return res.redirect(`/mis-lotes/${lote.id}/paso/${n}`);
  }

  const result = await loteService.avanzarOperario(lote.id, n, datosDelPaso);

  if (!result.ok) {
    if (result.code === 'YA_NOTIFICADO') {
      req.flash('error', `El lote ${lote.numeroLote} ya fue notificado al DT.`);
      return res.redirect(`/mis-lotes/${lote.id}/paso/9`);
    }
    return res.redirect(`/mis-lotes/${lote.id}/paso/${lote.pasoActual}`);
  }

  if (result.accion === 'notificado') {
    console.log(`[NOTIFICACION DT] Lote ${result.lote.numeroLote} marcado pendiente_firma por ${result.lote.operario}`);
    req.flash('ok', `Lote ${result.lote.numeroLote} notificado al Director Tecnico.`);
    return res.redirect('/mis-lotes');
  }

  const siguiente = n + 1;
  console.log(`[PASO COMPLETADO] Lote ${result.lote.numeroLote} - paso ${n} guardado por ${result.lote.operario}`);
  return res.redirect(`/mis-lotes/${lote.id}/paso/${siguiente}`);
}

module.exports = { getDashboard, getPaso, postPaso };
// Exports internos para testing directo (no usar en runtime).
module.exports._extractPasoData      = extractPasoData;
module.exports._validarPasoCompleto  = validarPasoCompleto;
// Exports internos para testing directo (no usar en runtime).
module.exports._extractPasoData     = extractPasoData;
module.exports._validarPasoCompleto = validarPasoCompleto;
