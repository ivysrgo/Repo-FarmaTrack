/**
 * tests/service/Services.extra.test.js
 *
 * Cobertura adicional de EventoService y NoConformidadService.resolver.
 */
'use strict';

const { EventoService }        = require('../../src/service/EventoService');
const { NoConformidadService } = require('../../src/service/NoConformidadService');
const { EventoRepository }     = require('../../src/repositories/EventoRepository');
const { NoConformidadRepository } = require('../../src/repositories/NoConformidadRepository');

describe('EventoService', () => {
  let svc;
  let repo;
  beforeEach(() => {
    repo = new EventoRepository();
    svc = new EventoService(repo);
  });

  it('constructor lanza si no recibe repo', () => {
    expect(() => new EventoService()).toThrow();
  });

  it('emit persiste y devuelve el documento', async () => {
    const e = await svc.emit({ tipo: 'lote_creado', texto: 'X', usuario: 'Juan' });
    expect(e.id).toBe(1);
    expect((await svc.listar()).length).toBe(1);
  });

  it('emit con campos mínimos default usuario=Sistema', async () => {
    const e = await svc.emit({ tipo: 'x', texto: 'A' });
    expect(e.usuario).toBe('Sistema');
  });

  it('emit no revienta si el repo tira (return null)', async () => {
    const repoErr = { create: jest.fn(async () => { throw new Error('boom'); }) };
    const s = new EventoService(repoErr);
    const r = await s.emit({ tipo: 'x', texto: 'A' });
    expect(r).toBeNull();
  });

  it('listar pasa filtros al repo', async () => {
    await svc.emit({ tipo: 'lote_creado', texto: 'A' });
    await svc.emit({ tipo: 'nc_reportada', texto: 'B' });
    const r = await svc.listar({ tipo: 'lote_creado' });
    expect(r).toHaveLength(1);
  });

  it('listarUltimos limita resultados', async () => {
    for (let i = 0; i < 8; i++) await svc.emit({ tipo: 'x', texto: String(i) });
    const r = await svc.listarUltimos(3);
    expect(r).toHaveLength(3);
  });
});

describe('NoConformidadService.resolver', () => {
  let loteRepo;
  let ncRepo;
  let eventoSvc;
  let svc;

  beforeEach(() => {
    // loteRepo mock minimal — solo necesita findById y update
    const lotes = [
      { id: 1, numeroLote: 'FT-001', estado: 'alerta_bpm' },
      { id: 2, numeroLote: 'FT-002', estado: 'en_produccion' },
    ];
    loteRepo = {
      findAll: jest.fn(async () => lotes),
      findById: jest.fn(async (id) => lotes.find(l => l.id === Number(id)) || null),
      update: jest.fn(async (id, partial) => {
        const l = lotes.find(x => x.id === Number(id));
        if (!l) return null;
        Object.assign(l, partial);
        return l;
      }),
    };
    ncRepo = new NoConformidadRepository();
    eventoSvc = { emit: jest.fn(async () => null) };
    svc = new NoConformidadService(loteRepo, ncRepo, eventoSvc);
  });

  it('NOT_FOUND si la NC no existe', async () => {
    const r = await svc.resolver(999, 'DT');
    expect(r.ok).toBe(false);
    expect(r.code).toBe('NOT_FOUND');
  });

  it('YA_RESUELTA si la NC ya estaba cerrada', async () => {
    const nc = await ncRepo.create({ tipo: 'x', descripcion: 'A' });
    await ncRepo.resolver(nc.id, 'OtroDT');
    const r = await svc.resolver(nc.id, 'DT');
    expect(r.ok).toBe(false);
    expect(r.code).toBe('YA_RESUELTA');
  });

  it('resolver NC bloqueante restaura el lote a en_produccion', async () => {
    const nc = await ncRepo.create({ tipo: 'x', descripcion: 'A', bloqueante: true, loteId: 1 });
    const r = await svc.resolver(nc.id, 'DT');
    expect(r.ok).toBe(true);
    expect(r.loteRestaurado).toBeDefined();
    expect(loteRepo.update).toHaveBeenCalledWith(1, { estado: 'en_produccion' });
  });

  it('resolver NC no bloqueante NO toca el lote', async () => {
    const nc = await ncRepo.create({ tipo: 'x', descripcion: 'A', bloqueante: false, loteId: 1 });
    const r = await svc.resolver(nc.id, 'DT');
    expect(r.ok).toBe(true);
    expect(r.loteRestaurado).toBeNull();
    expect(loteRepo.update).not.toHaveBeenCalled();
  });

  it('NO restaura lote si su estado no es alerta_bpm', async () => {
    const nc = await ncRepo.create({ tipo: 'x', descripcion: 'A', bloqueante: true, loteId: 2 });
    const r = await svc.resolver(nc.id, 'DT');
    expect(r.ok).toBe(true);
    expect(r.loteRestaurado).toBeNull();
  });

  it('emite evento al resolver', async () => {
    const nc = await ncRepo.create({ tipo: 'x', descripcion: 'A', bloqueante: true, loteId: 1, loteNumero: 'FT-001' });
    await svc.resolver(nc.id, 'DT');
    expect(eventoSvc.emit).toHaveBeenCalledWith(expect.objectContaining({ tipo: 'paso_completado' }));
  });
});
