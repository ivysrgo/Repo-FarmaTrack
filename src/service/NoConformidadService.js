/**
 * src/service/NoConformidadService.js
 *
 * Persiste NC + opcionalmente marca el lote con alerta_bpm + emite evento.
 * Tiene un método `resolver(ncId, resueltaPor)` que cierra la NC y, si era
 * bloqueante, devuelve el lote a 'en_produccion'.
 */
'use strict';

const ESTADOS_ACTIVOS_PARA_NC = [
  'en_espera', 'en_produccion', 'pendiente_firma',
  'en_calidad', 'alerta_bpm', 'bloqueado',
];

class NoConformidadService {
  constructor(loteRepo, ncRepo, eventoService) {
    if (!loteRepo) throw new Error('NoConformidadService requiere un loteRepo');
    if (!ncRepo)   throw new Error('NoConformidadService requiere un ncRepo');
    this.loteRepo      = loteRepo;
    this.ncRepo        = ncRepo;
    this.eventoService = eventoService || null;
  }

  async lotesActivos() {
    const all = await this.loteRepo.findAll();
    return all.filter(l => ESTADOS_ACTIVOS_PARA_NC.includes(l.estado));
  }

  async listar(filtros = {}) { return this.ncRepo.findAll(filtros); }
  async stats()              { return this.ncRepo.stats(); }

  validar(body) {
    const b = body || {};
    const errores = [];
    if (!b.tipo) errores.push('Selecciona el tipo de no conformidad.');
    if (!b.descripcion || !b.descripcion.trim())
      errores.push('La descripcion de la NC es obligatoria.');
    return errores;
  }

  async procesar(body, reportadoPor = '') {
    const errores = this.validar(body);
    if (errores.length > 0) return { ok: false, errores };

    let loteAfectado = null;
    let loteNumero   = '';

    if (body.loteId) {
      const lote = await this.loteRepo.findById(body.loteId);
      if (lote) {
        loteNumero = lote.numeroLote;
        if (body.bloqueante === '1' && lote.estado !== 'liberado') {
          loteAfectado = await this.loteRepo.update(lote.id || body.loteId, {
            estado:        'alerta_bpm',
            observaciones: body.descripcion,
          });
        }
      }
    }

    const pasoLote = parseInt(body.pasoLote, 10);
    const pasoValido = (!Number.isNaN(pasoLote) && pasoLote >= 1 && pasoLote <= 9) ? pasoLote : null;

    const nc = await this.ncRepo.create({
      tipo:         body.tipo,
      descripcion:  body.descripcion.trim(),
      impacto:      body.impacto || 'medio',
      bloqueante:   body.bloqueante === '1',
      loteId:       body.loteId || null,
      loteNumero,
      pasoLote:     pasoValido,
      reportadoPor,
    });

    if (this.eventoService) {
      await this.eventoService.emit({
        tipo:       'nc_reportada',
        texto:      `NC reportada (${body.tipo})${loteNumero ? ' en lote ' + loteNumero : ''}${pasoValido ? ' (paso ' + pasoValido + ')' : ''}: ${body.descripcion.substring(0, 80)}`,
        usuario:    reportadoPor || 'Sistema',
        loteId:     body.loteId || null,
        loteNumero,
        meta: { ncId: nc.id || nc._id, bloqueante: !!nc.bloqueante, paso: pasoValido },
      });
    }

    return { ok: true, nc, lote: loteAfectado };
  }

  /**
   * Cierra una NC. Si era bloqueante y el lote está en alerta_bpm, lo
   * devuelve a 'en_produccion' para que el operario pueda continuar.
   */
  async resolver(ncId, resueltaPor = '') {
    const nc = await this.ncRepo.findById(ncId);
    if (!nc) return { ok: false, error: 'NC no encontrada', code: 'NOT_FOUND' };
    if (nc.resuelta) return { ok: false, error: 'La NC ya estaba resuelta', code: 'YA_RESUELTA' };

    const ncActualizada = await this.ncRepo.resolver(ncId, resueltaPor);

    let loteRestaurado = null;
    if (nc.bloqueante && nc.loteId) {
      const lote = await this.loteRepo.findById(nc.loteId);
      if (lote && lote.estado === 'alerta_bpm') {
        loteRestaurado = await this.loteRepo.update(lote.id || nc.loteId, {
          estado: 'en_produccion',
        });
      }
    }

    if (this.eventoService) {
      await this.eventoService.emit({
        tipo:       'paso_completado',
        texto:      `NC resuelta${nc.loteNumero ? ' en lote ' + nc.loteNumero : ''} por ${resueltaPor || 'Sistema'}${loteRestaurado ? ' - lote restaurado a en_produccion' : ''}`,
        usuario:    resueltaPor || 'Sistema',
        loteId:     nc.loteId || null,
        loteNumero: nc.loteNumero || '',
        meta:       { ncResueltaId: nc.id, loteRestaurado: !!loteRestaurado },
      });
    }

    return { ok: true, nc: ncActualizada, loteRestaurado };
  }
}

const { getLoteRepo, getNCRepo } = require('../repositories');
const eventoService = require('./EventoService');
const instance = new NoConformidadService(getLoteRepo(), getNCRepo(), eventoService);
module.exports = instance;
module.exports.NoConformidadService = NoConformidadService;
