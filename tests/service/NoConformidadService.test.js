/**
 * tests/service/NoConformidadService.test.js (async)
 */
'use strict';

const { NoConformidadService } = require('../../src/service/NoConformidadService');

function buildMockRepo(seed = []) {
  const lotes = seed.map((l, i) => ({ id: i + 1, ...l }));
  return {
    _lotes: lotes,
    findAll: jest.fn(async () => [...lotes]),
    findById: jest.fn(async id => lotes.find(l => l.id === parseInt(id, 10)) || null),
    update: jest.fn(async (id, patch) => {
      const l = lotes.find(x => x.id === parseInt(id, 10));
      if (!l) return null;
      Object.assign(l, patch);
      return l;
    }),
  };
}

describe('NoConformidadService (async)', () => {
  let repo;
  let svc;

  beforeEach(() => {
    repo = buildMockRepo([
      { numeroLote: 'FT-001', estado: 'en_produccion' },
      { numeroLote: 'FT-002', estado: 'pendiente_firma' },
      { numeroLote: 'FT-003', estado: 'liberado' },
      { numeroLote: 'FT-004', estado: 'rechazado' },
      { numeroLote: 'FT-005', estado: 'alerta_bpm' },
      { numeroLote: 'FT-006', estado: 'en_espera' },
    ]);
    const mockNcRepo = { findAll: jest.fn().mockResolvedValue([]), findById: jest.fn().mockResolvedValue(null), create: jest.fn().mockImplementation(async d => ({ id: 1, ...d })), stats: jest.fn().mockResolvedValue({ total: 0, abiertas: 0, bloqueantes: 0 }) }; svc = new NoConformidadService(repo, mockNcRepo);
  });

  describe('constructor', () => {
    it('lanza si no recibe loteRepo', () => {
      expect(() => new NoConformidadService()).toThrow(/loteRepo/);
    });
  });

  describe('lotesActivos', () => {
    it('excluye liberados', async () => {
      const r = await svc.lotesActivos();
      expect(r.find(l => l.estado === 'liberado')).toBeUndefined();
    });
    it('excluye rechazados', async () => {
      const r = await svc.lotesActivos();
      expect(r.find(l => l.estado === 'rechazado')).toBeUndefined();
    });
    it('incluye en_produccion, pendiente_firma, en_espera, alerta_bpm', async () => {
      const r = await svc.lotesActivos();
      const estados = r.map(l => l.estado);
      expect(estados).toContain('en_produccion');
      expect(estados).toContain('pendiente_firma');
      expect(estados).toContain('en_espera');
      expect(estados).toContain('alerta_bpm');
    });
  });

  describe('validar', () => {
    it('cuerpo valido pasa', () => {
      expect(svc.validar({ tipo: 'desviacion_bpm', descripcion: 'algo' })).toEqual([]);
    });
    it('falta tipo', () => {
      expect(svc.validar({ descripcion: 'a' }).some(e => /tipo/i.test(e))).toBe(true);
    });
    it('falta descripcion', () => {
      expect(svc.validar({ tipo: 'x' }).some(e => /descripci/i.test(e))).toBe(true);
    });
    it('descripcion solo espacios', () => {
      expect(svc.validar({ tipo: 'x', descripcion: '   ' }).some(e => /descripci/i.test(e))).toBe(true);
    });
    it('cuerpo vacio -> 2 errores', () => {
      expect(svc.validar({}).length).toBe(2);
    });
    it('null/undefined no revienta', () => {
      expect(() => svc.validar(null)).not.toThrow();
      expect(() => svc.validar(undefined)).not.toThrow();
    });
  });

  describe('procesar', () => {
    it('no bloqueante: ok sin tocar lote', async () => {
      const r = await svc.procesar({ tipo: 'x', descripcion: 'NC menor', bloqueante: '0', loteId: '1' });
      expect(r.ok).toBe(true);
      expect(r.lote).toBeNull();
      expect(repo.update).not.toHaveBeenCalled();
    });
    it('bloqueante sobre en_produccion: marca alerta_bpm', async () => {
      const r = await svc.procesar({ tipo: 'desv', descripcion: 'Temp fuera', bloqueante: '1', loteId: '1' });
      expect(r.ok).toBe(true);
      expect(r.lote.estado).toBe('alerta_bpm');
      expect(r.lote.observaciones).toBe('Temp fuera');
    });
    it('bloqueante sobre liberado: NO toca el lote', async () => {
      const r = await svc.procesar({ tipo: 'x', descripcion: 'tardia', bloqueante: '1', loteId: '3' });
      expect(r.ok).toBe(true);
      expect(r.lote).toBeNull();
      expect(repo.update).not.toHaveBeenCalled();
    });
    it('bloqueante con loteId inexistente: no revienta', async () => {
      const r = await svc.procesar({ tipo: 'x', descripcion: 'd', bloqueante: '1', loteId: '99999' });
      expect(r.ok).toBe(true);
      expect(r.lote).toBeNull();
    });
    it('validacion falla -> ok:false con errores', async () => {
      const r = await svc.procesar({ tipo: '', descripcion: '' });
      expect(r.ok).toBe(false);
      expect(r.errores.length).toBeGreaterThan(0);
      expect(repo.update).not.toHaveBeenCalled();
    });
    it('bloqueante=1 sin loteId: ok sin tocar nada', async () => {
      const r = await svc.procesar({ tipo: 'x', descripcion: 'sin lote', bloqueante: '1' });
      expect(r.ok).toBe(true);
      expect(r.lote).toBeNull();
    });
  });
});
