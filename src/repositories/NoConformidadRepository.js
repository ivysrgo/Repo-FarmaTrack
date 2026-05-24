'use strict';

class NoConformidadRepository {
  constructor() {
    this._items = [];
    this._nextId = 1;
  }
  async findAll(filtros = {}) {
    let r = [...this._items];
    if (filtros.tipo)        r = r.filter(x => x.tipo === filtros.tipo);
    if (filtros.loteId)      r = r.filter(x => String(x.loteId) === String(filtros.loteId));
    if (filtros.bloqueante !== undefined) r = r.filter(x => x.bloqueante === filtros.bloqueante);
    if (filtros.resuelta !== undefined)   r = r.filter(x => x.resuelta === filtros.resuelta);
    return r.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  async findById(id) {
    const num = parseInt(id, 10);
    if (Number.isNaN(num)) return null;
    return this._items.find(x => x.id === num) || null;
  }
  async create(data) {
    const nc = {
      id: this._nextId++,
      tipo: data.tipo || 'otro',
      descripcion: data.descripcion || '',
      impacto: data.impacto || 'medio',
      bloqueante: !!data.bloqueante,
      loteId: data.loteId || null,
      loteNumero: data.loteNumero || '',
      pasoLote: data.pasoLote || null,
      reportadoPor: data.reportadoPor || '',
      resuelta: false,
      resueltaPor: null,
      resueltaEn: null,
      createdAt: new Date().toISOString(),
    };
    this._items.push(nc);
    return nc;
  }
  async stats() {
    return {
      total: this._items.length,
      abiertas: this._items.filter(x => !x.resuelta).length,
      bloqueantes: this._items.filter(x => x.bloqueante && !x.resuelta).length,
    };
  }

  async resolver(id, resueltaPor = '') {
    const num = parseInt(id, 10);
    const nc = this._items.find(x => x.id === num);
    if (!nc) return null;
    nc.resuelta = true;
    nc.resueltaPor = resueltaPor;
    nc.resueltaEn = new Date().toISOString();
    return nc;
  }
}

const instance = new NoConformidadRepository();
module.exports = instance;
module.exports.NoConformidadRepository = NoConformidadRepository;
