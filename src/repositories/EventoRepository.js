'use strict';

class EventoRepository {
  constructor() {
    this._items = [];
    this._nextId = 1;
  }
  async findAll(filtros = {}) {
    let r = [...this._items];
    if (filtros.tipo)    r = r.filter(x => x.tipo === filtros.tipo);
    if (filtros.usuario) r = r.filter(x => x.usuario === filtros.usuario);
    if (filtros.loteId)  r = r.filter(x => String(x.loteId) === String(filtros.loteId));
    r.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (filtros.limit) r = r.slice(0, filtros.limit);
    return r;
  }
  async create(data) {
    const e = {
      id: this._nextId++,
      tipo: data.tipo,
      texto: data.texto || '',
      usuario: data.usuario || 'Sistema',
      loteId: data.loteId || null,
      loteNumero: data.loteNumero || '',
      meta: data.meta || {},
      createdAt: new Date().toISOString(),
    };
    this._items.push(e);
    return e;
  }
  async countAll() { return this._items.length; }
}

const instance = new EventoRepository();
module.exports = instance;
module.exports.EventoRepository = EventoRepository;
