/**
 * tests/repositories/MemoryRepos.test.js
 *
 * Tests directos sobre los repos en memoria (MateriaPrima, Evento, NoConformidad).
 * Estos repos también se usan en producción cuando no hay MONGO_URI, así que
 * sus invariantes importan.
 */
'use strict';

const { MateriaPrimaRepository } = require('../../src/repositories/MateriaPrimaRepository');
const { EventoRepository }       = require('../../src/repositories/EventoRepository');
const { NoConformidadRepository } = require('../../src/repositories/NoConformidadRepository');

describe('MateriaPrimaRepository (memoria)', () => {
  let repo;
  beforeEach(() => { repo = new MateriaPrimaRepository(); });

  it('arranca con 7 MPs del seed', async () => {
    const all = await repo.findAll();
    expect(all).toHaveLength(7);
  });

  it('findAll devuelve ordenado por código alfabético', async () => {
    const all = await repo.findAll();
    const codigos = all.map(m => m.codigo);
    expect(codigos).toEqual([...codigos].sort());
  });

  it('cada MP tiene estado derivado (ok / bajo / agotado)', async () => {
    const all = await repo.findAll();
    all.forEach(m => expect(['ok','bajo','agotado']).toContain(m.estado));
  });

  it('MP-003 (stock 18.5 < min 30) está en estado "bajo"', async () => {
    const mp = await repo.findByCodigo('MP-003');
    expect(mp.estado).toBe('bajo');
  });

  it('MP-006 (stock 0) está "agotado"', async () => {
    const mp = await repo.findByCodigo('MP-006');
    expect(mp.estado).toBe('agotado');
  });

  it('findByCodigo retorna null si no existe', async () => {
    expect(await repo.findByCodigo('MP-XYZ')).toBeNull();
  });

  it('create añade MP nueva y le asigna id', async () => {
    const mp = await repo.create({ codigo: 'MP-999', nombre: 'Test', stockKg: 50, stockMinKg: 10, proveedor: 'X' });
    expect(mp.id).toBeDefined();
    expect(mp.codigo).toBe('MP-999');
    expect(mp.estado).toBe('ok');
    expect(await repo.findAll()).toHaveLength(8);
  });

  it('create con stockKg 0 → estado agotado', async () => {
    const mp = await repo.create({ codigo: 'MP-Z', nombre: 'Z', stockKg: 0, stockMinKg: 5 });
    expect(mp.estado).toBe('agotado');
  });

  it('stats devuelve total/bajos/agotados', async () => {
    const s = await repo.stats();
    expect(s.total).toBe(7);
    expect(s.bajos).toBeGreaterThanOrEqual(1);
    expect(s.agotados).toBeGreaterThanOrEqual(1);
  });
});

describe('EventoRepository (memoria)', () => {
  let repo;
  beforeEach(() => { repo = new EventoRepository(); });

  it('arranca vacío', async () => {
    expect(await repo.findAll()).toHaveLength(0);
    expect(await repo.countAll()).toBe(0);
  });

  it('create asigna id incremental y createdAt', async () => {
    const e = await repo.create({ tipo: 'lote_creado', texto: 'X' });
    expect(e.id).toBe(1);
    expect(e.createdAt).toBeDefined();
  });

  it('findAll ordena por createdAt desc', async () => {
    await repo.create({ tipo: 'a', texto: '1' });
    await new Promise(r => setTimeout(r, 10));
    await repo.create({ tipo: 'b', texto: '2' });
    const all = await repo.findAll();
    expect(all[0].tipo).toBe('b');
    expect(all[1].tipo).toBe('a');
  });

  it('filtra por tipo', async () => {
    await repo.create({ tipo: 'lote_creado', texto: 'A' });
    await repo.create({ tipo: 'nc_reportada', texto: 'B' });
    const r = await repo.findAll({ tipo: 'lote_creado' });
    expect(r).toHaveLength(1);
    expect(r[0].texto).toBe('A');
  });

  it('filtra por usuario', async () => {
    await repo.create({ tipo: 'x', texto: 'A', usuario: 'Juan' });
    await repo.create({ tipo: 'x', texto: 'B', usuario: 'Ana' });
    const r = await repo.findAll({ usuario: 'Juan' });
    expect(r).toHaveLength(1);
  });

  it('filtra por loteId (coerción string)', async () => {
    await repo.create({ tipo: 'x', texto: 'A', loteId: 42 });
    const r = await repo.findAll({ loteId: '42' });
    expect(r).toHaveLength(1);
  });

  it('respeta el limit', async () => {
    for (let i = 0; i < 10; i++) await repo.create({ tipo: 'x', texto: String(i) });
    const r = await repo.findAll({ limit: 3 });
    expect(r).toHaveLength(3);
  });

  it('defaults: usuario=Sistema, loteNumero=""', async () => {
    const e = await repo.create({ tipo: 'x', texto: '' });
    expect(e.usuario).toBe('Sistema');
    expect(e.loteNumero).toBe('');
  });
});

describe('NoConformidadRepository (memoria)', () => {
  let repo;
  beforeEach(() => { repo = new NoConformidadRepository(); });

  it('arranca vacío', async () => {
    expect(await repo.findAll()).toHaveLength(0);
  });

  it('create asigna id, defaults y createdAt', async () => {
    const nc = await repo.create({ tipo: 'desviacion_bpm', descripcion: 'Test' });
    expect(nc.id).toBe(1);
    expect(nc.impacto).toBe('medio');
    expect(nc.bloqueante).toBe(false);
    expect(nc.resuelta).toBe(false);
    expect(nc.createdAt).toBeDefined();
  });

  it('findById parsea id numérico', async () => {
    const nc = await repo.create({ tipo: 'x', descripcion: 'A' });
    expect((await repo.findById(nc.id)).descripcion).toBe('A');
    expect((await repo.findById(String(nc.id))).descripcion).toBe('A');
    expect(await repo.findById('abc')).toBeNull();
    expect(await repo.findById(999)).toBeNull();
  });

  it('findAll filtra por tipo', async () => {
    await repo.create({ tipo: 'desviacion_bpm', descripcion: 'A' });
    await repo.create({ tipo: 'equipo_falla',   descripcion: 'B' });
    expect((await repo.findAll({ tipo: 'equipo_falla' }))).toHaveLength(1);
  });

  it('findAll filtra por loteId', async () => {
    await repo.create({ tipo: 'x', descripcion: 'A', loteId: 'lote-1' });
    await repo.create({ tipo: 'x', descripcion: 'B', loteId: 'lote-2' });
    const r = await repo.findAll({ loteId: 'lote-1' });
    expect(r).toHaveLength(1);
  });

  it('findAll filtra por bloqueante=true', async () => {
    await repo.create({ tipo: 'x', descripcion: 'A', bloqueante: true });
    await repo.create({ tipo: 'x', descripcion: 'B', bloqueante: false });
    const r = await repo.findAll({ bloqueante: true });
    expect(r).toHaveLength(1);
  });

  it('findAll filtra por resuelta=false', async () => {
    const nc1 = await repo.create({ tipo: 'x', descripcion: 'A' });
    await repo.create({ tipo: 'x', descripcion: 'B' });
    await repo.resolver(nc1.id, 'DT');
    const r = await repo.findAll({ resuelta: false });
    expect(r).toHaveLength(1);
    expect(r[0].descripcion).toBe('B');
  });

  it('stats cuenta total/abiertas/bloqueantes', async () => {
    await repo.create({ tipo: 'x', descripcion: 'A', bloqueante: true });
    await repo.create({ tipo: 'x', descripcion: 'B', bloqueante: false });
    const s = await repo.stats();
    expect(s.total).toBe(2);
    expect(s.abiertas).toBe(2);
    expect(s.bloqueantes).toBe(1);
  });

  it('resolver marca como resuelta y guarda resueltaPor/resueltaEn', async () => {
    const nc = await repo.create({ tipo: 'x', descripcion: 'A' });
    const r = await repo.resolver(nc.id, 'Juan');
    expect(r.resuelta).toBe(true);
    expect(r.resueltaPor).toBe('Juan');
    expect(r.resueltaEn).toBeDefined();
  });

  it('resolver con id inexistente devuelve null', async () => {
    expect(await repo.resolver(999, 'Juan')).toBeNull();
  });
});
