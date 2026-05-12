/**
 * src/controllers/NoConformidadController.js
 * Módulo de No-Conformidades — RQF-21, RQF-22, RQF-23
 */
'use strict';

/**
 * GET /noconformidad/nueva
 */
function mostrarFormulario(req, res) {
  res.render('noconformidad/nueva', {
    title:   'Registrar no conformidad',
    currentPath: '/noconformidad/nueva',
    errores: [],
    lote: {
      id:       'LT-2024-089',
      producto: 'Amoxicilina 500mg',
      paso:     'Paso 3 — Verificación de pesos',
      operario: 'Juan Bahos',
    },
  });
}

/**
 * POST /noconformidad
 * _action = 'guardar'  → guarda borrador
 * _action = 'reportar' → registra y notifica al DT (RQF-22, RQF-23)
 */
function procesarFormulario(req, res) {
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
      title:   'Registrar no conformidad',
      currentPath: '/noconformidad/nueva',
      errores,
      lote: { id: loteRef, producto, paso: pasoProceso, operario },
    });
  }

  // TODO: persistir en MongoDB y emitir evento de bitácora (RQF-27)
  // TODO: si _action === 'reportar', notificar al DT (RQF-23)
  console.log(`[NC] ${_action?.toUpperCase()} | Lote: ${loteRef} | Severidad: ${severidad} | Parámetro: ${parametro}`);

  res.redirect('/panel?flash=nc_guardada');
}

module.exports = { mostrarFormulario, procesarFormulario };
