/**
 * src/service/EventoService.js
 *
 * Servicio para registrar eventos del sistema (bitácora real).
 * Los demás services (LoteService, NoConformidadService) llaman a
 * EventoService.emit() después de cada acción importante.
 */
'use strict';

class EventoService {
  constructor(eventoRepo) {
    if (!eventoRepo) throw new Error('EventoService requiere un eventoRepo');
    this.eventoRepo = eventoRepo;
  }

  /**
   * Emite un evento. Es fire-and-forget: si falla, NO debe romper la
   * operación de negocio que lo originó (por eso atrapamos errores).
   */
  async emit({ tipo, texto, usuario, loteId, loteNumero, meta }) {
    try {
      return await this.eventoRepo.create({
        tipo, texto,
        usuario:    usuario    || 'Sistema',
        loteId:     loteId     || null,
        loteNumero: loteNumero || '',
        meta:       meta || {},
      });
    } catch (err) {
      console.error('[EventoService] No se pudo registrar evento:', err.message);
      return null;
    }
  }

  /** Lista de eventos. Filtros opcionales: { tipo, usuario, loteId, limit }. */
  async listar(filtros = {}) {
    return this.eventoRepo.findAll(filtros);
  }

  async listarUltimos(n = 5) {
    return this.eventoRepo.findAll({ limit: n });
  }
}

const { getEventoRepo } = require('../repositories');
const instance = new EventoService(getEventoRepo());
module.exports = instance;
module.exports.EventoService = EventoService;
