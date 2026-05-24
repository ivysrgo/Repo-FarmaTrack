/**
 * src/repositories/MateriaPrimaRepository.js
 *
 * Repositorio en memoria de Materias Primas.
 * Arranca con las 7 MPs que antes estaban hardcodeadas en
 * SidebarController.getInventario(). Así la vista /inventario sigue viéndose
 * igual en modo memoria/demo y la fuente de datos queda unificada con la
 * versión Mongo.
 */
'use strict';

function _estadoDesdeStock(stockKg, stockMinKg) {
  if (stockKg <= 0) return 'agotado';
  if (stockKg < stockMinKg) return 'bajo';
  return 'ok';
}

function _attach(mp) {
  if (!mp) return mp;
  return { ...mp, estado: _estadoDesdeStock(mp.stockKg, mp.stockMinKg) };
}

class MateriaPrimaRepository {
  constructor() {
    this._items = [];
    this._nextId = 1;
    this._seedDemo();
  }

  _seedDemo() {
    const demo = [
      { codigo: 'MP-001', nombre: 'Amoxicilina trihidrato',   stockKg: 145.2, stockMinKg: 50, proveedor: 'Quimifarma S.A.' },
      { codigo: 'MP-002', nombre: 'Celulosa microcristalina', stockKg: 320.0, stockMinKg: 80, proveedor: 'Excipientes Andes' },
      { codigo: 'MP-003', nombre: 'Almidon de maiz',          stockKg: 18.5,  stockMinKg: 30, proveedor: 'Granos Industrial' },
      { codigo: 'MP-004', nombre: 'Estearato de magnesio',    stockKg: 12.0,  stockMinKg: 5,  proveedor: 'Excipientes Andes' },
      { codigo: 'MP-005', nombre: 'Dioxido de silicio',       stockKg: 8.3,   stockMinKg: 5,  proveedor: 'Quimifarma S.A.' },
      { codigo: 'MP-006', nombre: 'Lactosa monohidrato',      stockKg: 0,     stockMinKg: 40, proveedor: 'Granos Industrial' },
      { codigo: 'MP-007', nombre: 'Povidona K30',             stockKg: 22.5,  stockMinKg: 10, proveedor: 'Excipientes Andes' },
    ];
    demo.forEach(d => this._items.push({
      id: this._nextId++,
      codigo:     d.codigo,
      nombre:     d.nombre,
      stockKg:    d.stockKg,
      stockMinKg: d.stockMinKg,
      proveedor:  d.proveedor,
      createdAt:  new Date().toISOString(),
    }));
  }

  async findAll() {
    return this._items
      .map(_attach)
      .sort((a, b) => a.codigo.localeCompare(b.codigo));
  }

  async findByCodigo(codigo) {
    const mp = this._items.find(x => x.codigo === codigo);
    return mp ? _attach(mp) : null;
  }

  async create(data) {
    const mp = {
      id:         this._nextId++,
      codigo:     data.codigo,
      nombre:     data.nombre || '',
      stockKg:    Number(data.stockKg) || 0,
      stockMinKg: Number(data.stockMinKg) || 0,
      proveedor:  data.proveedor || '',
      createdAt:  new Date().toISOString(),
    };
    this._items.push(mp);
    return _attach(mp);
  }

  async stats() {
    const all = this._items.map(_attach);
    return {
      total:    all.length,
      bajos:    all.filter(m => m.estado === 'bajo').length,
      agotados: all.filter(m => m.estado === 'agotado').length,
    };
  }
}

const instance = new MateriaPrimaRepository();
module.exports = instance;
module.exports.MateriaPrimaRepository = MateriaPrimaRepository;
