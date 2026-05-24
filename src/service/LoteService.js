/**
 * src/service/LoteService.js (async + eventos + manejo E11000)
 */
'use strict';

class LoteService {
  constructor(loteRepo, eventoService = null) {
    if (!loteRepo) throw new Error('LoteService requiere un loteRepo');
    this.loteRepo = loteRepo;
    this.eventoService = eventoService;
  }

  async _emit(payload) {
    if (this.eventoService && typeof this.eventoService.emit === 'function') {
      try { await this.eventoService.emit(payload); }
      catch (e) { console.error('[LoteService] emit fallo:', e.message); }
    }
  }

  async findAll(filtros) { return this.loteRepo.findAll(filtros); }
  async findById(id)     { return this.loteRepo.findById(id); }
  async stats()          { return this.loteRepo.stats(); }

  validateNuevaOrden(body) {
    const b = body || {};
    const errores = [];
    if (!b.numeroOrden || !b.numeroOrden.trim())  errores.push('El numero de orden de produccion es obligatorio.');
    if (!b.codigoLote  || !b.codigoLote.trim())   errores.push('El codigo de lote asignado es obligatorio.');
    if (!b.producto    || !b.producto.trim())     errores.push('El producto a fabricar es obligatorio.');
    // formulaId queda OPCIONAL en backend (el frontend la marca required vía
    // <select required>). Si no llega, lote.formulaId='' y getFormula() cae
    // a buscar por lote.producto. Esto permite no romper APIs legacy / tests.
    const cantidad = parseInt(b.cantidad, 10);
    if (!cantidad || cantidad < 100) errores.push('La cantidad planificada debe ser un numero mayor o igual a 100.');
    if (!b.fechaInicio)  errores.push('La fecha de inicio planificada es obligatoria.');
    if (!b.operario)     errores.push('Debes asignar un operario de produccion.');
    if (!b.jefeCalidad)  errores.push('Debes asignar un jefe de calidad.');
    if (!b.area)         errores.push('Debes seleccionar el area de produccion.');
    if (!b.confirmFormula)  errores.push('Debes confirmar que la formula maestra esta aprobada y vigente.');
    if (!b.confirmMaterias) errores.push('Debes confirmar la disponibilidad de materias primas.');
    if (!b.confirmEquipos)  errores.push('Debes confirmar que los equipos estan habilitados.');
    return errores;
  }

  async crearOrden(body, directorFallback) {
    const errores = this.validateNuevaOrden(body);
    if (errores.length > 0) return { ok: false, errores };

    let lote;
    try {
      lote = await this.loteRepo.create({
        numeroOrden:         body.numeroOrden.trim(),
        numeroLote:          body.codigoLote.trim(),
        producto:            body.producto.trim(),
        formulaId:           (body.formulaId || '').trim(),  // clave de src/data/formulas.js
        formaFarmaceutica:   (body.formaFarmaceutica || '').trim(),
        concentracion:       (body.concentracion || '').trim(),
        cantidadPlanificada: parseInt(body.cantidad, 10),
        fechaInicio:         new Date(body.fechaInicio).toISOString(),
        fechaFin:            body.fechaFin ? new Date(body.fechaFin).toISOString() : null,
        estado:              'en_espera',
        pasoActual:          1,
        operario:            body.operario,
        jefeCalidad:         body.jefeCalidad,
        directorTecnico:     (body.directorTecnico || '').trim() || directorFallback || 'Director Tecnico',
        area:                body.area,
        observaciones:       (body.observaciones || '').trim(),
        tiempoTranscurrido:  '0m',
      });
    } catch (err) {
      // Mongo rechaza inserts que violan el unique index. No tirar la app.
      if (err && err.code === 11000) {
        const campo = err.keyPattern && Object.keys(err.keyPattern)[0];
        if (campo === 'numeroLote') {
          return { ok: false, errores: [`Ya existe un lote con código "${body.codigoLote.trim()}". Usa un código distinto.`] };
        }
        return { ok: false, errores: [`Ya existe un registro con valores duplicados (${campo}).`] };
      }
      console.error('[LoteService.crearOrden] Error al persistir:', err && err.message);
      return { ok: false, errores: ['No se pudo crear el lote. Intenta de nuevo o revisa los logs.'] };
    }

    await this._emit({
      tipo: 'lote_creado',
      texto: `Lote ${lote.numeroLote} creado (${lote.producto}) - operario: ${lote.operario}`,
      usuario: directorFallback || 'Director Tecnico',
      loteId: lote.id || lote._id,
      loteNumero: lote.numeroLote,
    });

    return { ok: true, lote };
  }

  canLiberar(lote) {
    if (!lote)                       return { ok: false, code: 'NOT_FOUND',   reason: 'Lote no encontrado.' };
    if (lote.estado === 'liberado')  return { ok: false, code: 'YA_LIBERADO', reason: 'El lote ya estaba liberado.' };
    if (lote.estado === 'rechazado') return { ok: false, code: 'RECHAZADO',   reason: 'El lote fue rechazado y no puede liberarse.' };
    return { ok: true };
  }

  async liberar(loteId, firmante) {
    const lote = await this.loteRepo.findById(loteId);
    const check = this.canLiberar(lote);
    if (!check.ok) return { ok: false, error: check.reason, code: check.code };

    const ahora = new Date().toISOString();
    const actualizado = await this.loteRepo.update(lote.id || loteId, {
      estado:      'liberado',
      pasoActual:  9,
      liberadoPor: firmante || lote.directorTecnico || 'Director Tecnico',
      liberadoEn:  ahora,
      fechaFin:    ahora,
    });

    await this._emit({
      tipo: 'lote_liberado',
      texto: `Lote ${actualizado.numeroLote} liberado y firmado por ${actualizado.liberadoPor}`,
      usuario: firmante || 'Director Tecnico',
      loteId: actualizado.id || actualizado._id,
      loteNumero: actualizado.numeroLote,
    });

    return { ok: true, lote: actualizado };
  }

  async avanzarOperario(loteId, n, datosDelPaso) {
    const lote = await this.loteRepo.findById(loteId);
    if (!lote) return { ok: false, error: 'Lote no encontrado.', code: 'NOT_FOUND' };

    const paso = parseInt(n, 10);
    if (Number.isNaN(paso) || paso < 1 || paso > 9) {
      return { ok: false, error: 'Paso invalido.', code: 'INVALID_STEP' };
    }

    let datos;
    if (typeof datosDelPaso === 'string') {
      datos = { observaciones: datosDelPaso.trim() };
    } else if (datosDelPaso && typeof datosDelPaso === 'object') {
      datos = { ...datosDelPaso };
      if (typeof datos.observaciones === 'string') datos.observaciones = datos.observaciones.trim();
    } else {
      datos = {};
    }

    const obs = datos.observaciones || '';
    const idRef = lote.id || loteId;
    const pasosPrev = (lote.pasos && typeof lote.pasos === 'object') ? lote.pasos : {};
    const pasosNuevos = { ...pasosPrev, [paso]: { ...datos, fechaRegistro: new Date().toISOString() } };

    if (paso === 9) {
      if (lote.estado === 'pendiente_firma' || lote.estado === 'liberado') {
        return { ok: false, error: 'El lote ya fue notificado al DT.', code: 'YA_NOTIFICADO' };
      }
      const actualizado = await this.loteRepo.update(idRef, {
        estado:        'pendiente_firma',
        pasoActual:    9,
        observaciones: obs || lote.observaciones,
        pasos:         pasosNuevos,
      });

      await this._emit({
        tipo: 'lote_pendiente_firma',
        texto: `Lote ${actualizado.numeroLote} completado por operario, esperando firma del DT`,
        usuario: actualizado.operario || 'Operario',
        loteId: actualizado.id || actualizado._id,
        loteNumero: actualizado.numeroLote,
        meta: { paso: 9 },
      });

      return { ok: true, lote: actualizado, accion: 'notificado' };
    }

    const siguiente = paso + 1;
    const patch = {
      observaciones: obs || lote.observaciones,
      pasoActual:    Math.max(lote.pasoActual, siguiente),
      pasos:         pasosNuevos,
    };
    if (lote.estado === 'en_espera') patch.estado = 'en_produccion';

    const actualizado = await this.loteRepo.update(idRef, patch);

    await this._emit({
      tipo: 'paso_completado',
      texto: `Lote ${actualizado.numeroLote} - paso ${paso} completado por ${actualizado.operario || 'operario'}`,
      usuario: actualizado.operario || 'Operario',
      loteId: actualizado.id || actualizado._id,
      loteNumero: actualizado.numeroLote,
      meta: { paso },
    });

    return { ok: true, lote: actualizado, accion: 'avanzado' };
  }
}

const { getLoteRepo } = require('../repositories');
const eventoService = require('./EventoService');
const instance = new LoteService(getLoteRepo(), eventoService);
module.exports = instance;
module.exports.LoteService = LoteService;
