/**
 * tests/repositories/LoteRepository.test.js
 *
 * Tests del repo en memoria. Ahora todos los metodos son async (mantienen
 * la misma interfaz que LoteRepositoryMongo).
 */
'use strict';

const { LoteRepository, ESTADOS, labelFor } = require('../../src/repositories/LoteRepository');

describe('LoteRepository (async)', () => {
  let repo;

  beforeEach(() => {
    repo = new LoteRepository();
  });

  describe('seed inicial', () => {
    it('arranca con 5 lotes demo', async () => {
      expect(await repo.findAll()).toHaveLength(5);
    });

    it('todos los lotes seed tienen id, numeroLote y estado', async () => {
      const all = await repo.findAll();
      all.forEach(l => {
        expect(l.id).toEqual(expect.any(Number));
        expect(l.numeroLote).toEqual(expect.any(String));
        expect(l.estado).toEqual(expect.any(String));
      });
    });

    it('cada lote tiene un estadoLabel coherente con su estado', async () => {
      (await repo.findAll()).forEach(l => {
        expect(l.estadoLabel).toBe(labelFor(l.estado));
      });
    });

    it('los IDs son unicos y consecutivos (1..5)', async () => {
      const ids = (await repo.findAll()).map(l => l.id).sort((a, b) => a - b);
      expect(ids).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('findAll con filtros', () => {
    it('sin filtros devuelve todos', async () => {
      expect(await repo.findAll()).toHaveLength(5);
    });
    it('filtra por estado exacto', async () => {
      const liberados = await repo.findAll({ estado: 'liberado' });
      liberados.forEach(l => expect(l.estado).toBe('liberado'));
    });
    it('estado inexistente devuelve []', async () => {
      expect(await repo.findAll({ estado: 'inexistente' })).toEqual([]);
    });
    it('busqueda q encuentra por numero de lote', async () => {
      const r = await repo.findAll({ q: 'FT-2026-0041' });
      expect(r.length).toBe(1);
      expect(r[0].numeroLote).toBe('FT-2026-0041');
    });
    it('busqueda q encuentra por nombre de producto (case-insensitive)', async () => {
      const r = await repo.findAll({ q: 'amoxicilina' });
      expect(r.length).toBeGreaterThan(0);
      expect(r[0].producto.toLowerCase()).toContain('amoxicilina');
    });
    it('busqueda q encuentra por nombre del operario', async () => {
      const r = await repo.findAll({ q: 'Carlos' });
      expect(r.length).toBeGreaterThan(0);
      expect(r[0].operario).toContain('Carlos');
    });
    it('busqueda q encuentra por numero de orden', async () => {
      const r = await repo.findAll({ q: 'OP-2026-041' });
      expect(r.length).toBe(1);
    });
    it('busqueda q sin matches devuelve []', async () => {
      expect(await repo.findAll({ q: 'xyzqwerty123' })).toEqual([]);
    });
    it('combina filtros: estado + q', async () => {
      const r = await repo.findAll({ estado: 'liberado', q: 'loratadina' });
      r.forEach(l => {
        expect(l.estado).toBe('liberado');
        expect(l.producto.toLowerCase()).toContain('loratadina');
      });
    });
  });

  describe('findById', () => {
    it('encuentra lote por id numerico', async () => {
      expect(await repo.findById(1)).not.toBeNull();
    });
    it('encuentra lote por id string numerico', async () => {
      expect(await repo.findById('2')).not.toBeNull();
    });
    it('retorna null para id inexistente', async () => {
      expect(await repo.findById(99999)).toBeNull();
    });
    it('retorna null para id no numerico', async () => {
      expect(await repo.findById('abc')).toBeNull();
    });
    it('retorna null para undefined', async () => {
      expect(await repo.findById(undefined)).toBeNull();
    });
  });

  describe('create', () => {
    it('asigna id consecutivo (6 despues de los 5 seed)', async () => {
      const nuevo = await repo.create({ producto: 'TestMed', cantidadPlanificada: 1000 });
      expect(nuevo.id).toBe(6);
    });
    it('autogenera numeroLote si no se provee', async () => {
      const nuevo = await repo.create({ producto: 'X', cantidadPlanificada: 100 });
      expect(nuevo.numeroLote).toMatch(/^FT-\d{4}-\d{4}$/);
    });
    it('respeta numeroLote provisto', async () => {
      const nuevo = await repo.create({ numeroLote: 'FT-CUSTOM-001', producto: 'X', cantidadPlanificada: 100 });
      expect(nuevo.numeroLote).toBe('FT-CUSTOM-001');
    });
    it('default estado=en_espera', async () => {
      const nuevo = await repo.create({ producto: 'X', cantidadPlanificada: 100 });
      expect(nuevo.estado).toBe('en_espera');
      expect(nuevo.estadoLabel).toBe('En espera');
    });
    it('default pasoActual=1', async () => {
      const nuevo = await repo.create({ producto: 'X', cantidadPlanificada: 100 });
      expect(nuevo.pasoActual).toBe(1);
    });
    it('calcula iniciales del operario', async () => {
      const nuevo = await repo.create({ producto: 'X', cantidadPlanificada: 100, operario: 'Juan Perez' });
      expect(nuevo.operarioIniciales).toBe('JP');
    });
    it('cantidadPlanificada parseada como int', async () => {
      const nuevo = await repo.create({ producto: 'X', cantidadPlanificada: '5000' });
      expect(nuevo.cantidadPlanificada).toBe(5000);
    });
    it('segundo create da id=7', async () => {
      await repo.create({ producto: 'A', cantidadPlanificada: 100 });
      const segundo = await repo.create({ producto: 'B', cantidadPlanificada: 100 });
      expect(segundo.id).toBe(7);
    });
  });

  describe('update', () => {
    it('actualiza estado y recalcula estadoLabel', async () => {
      const r = await repo.update(1, { estado: 'liberado' });
      expect(r.estado).toBe('liberado');
      expect(r.estadoLabel).toBe('Liberado');
    });
    it('actualiza pasoActual', async () => {
      const r = await repo.update(1, { pasoActual: 7 });
      expect(r.pasoActual).toBe(7);
    });
    it('actualiza producto y alias medicamento', async () => {
      const r = await repo.update(1, { producto: 'NuevoMed' });
      expect(r.producto).toBe('NuevoMed');
      expect(r.medicamento).toBe('NuevoMed');
    });
    it('actualiza operario y recalcula iniciales', async () => {
      const r = await repo.update(1, { operario: 'Ana Beatriz' });
      expect(r.operarioIniciales).toBe('AB');
      expect(r.operarioInicial).toBe('AB');
    });
    it('retorna null si el lote no existe', async () => {
      expect(await repo.update(99999, { estado: 'liberado' })).toBeNull();
    });
    it('actualizaciones parciales preservan otros campos', async () => {
      const antes = { ...(await repo.findById(1)) };
      await repo.update(1, { observaciones: 'nuevo comentario' });
      const despues = await repo.findById(1);
      expect(despues.numeroLote).toBe(antes.numeroLote);
      expect(despues.producto).toBe(antes.producto);
      expect(despues.observaciones).toBe('nuevo comentario');
    });
  });

  describe('stats', () => {
    it('total = numero de lotes', async () => {
      const s = await repo.stats();
      const all = await repo.findAll();
      expect(s.total).toBe(all.length);
    });
    it('cuenta correcta por cada estado seed', async () => {
      const s = await repo.stats();
      expect(s.enProduccion).toBe(1);
      expect(s.pendientesFirma).toBe(1);
      expect(s.enCalidad).toBe(1);
      expect(s.liberados).toBe(1);
      expect(s.alertasBPM).toBe(1);
      expect(s.bloqueados).toBe(0);
    });
    it('stats reflejan cambios despues de update', async () => {
      await repo.update(1, { estado: 'liberado' });
      const s = await repo.stats();
      expect(s.enProduccion).toBe(0);
      expect(s.liberados).toBe(2);
    });
    it('stats reflejan nuevos lotes', async () => {
      const antes = (await repo.stats()).total;
      await repo.create({ producto: 'X', cantidadPlanificada: 100, estado: 'bloqueado' });
      expect((await repo.stats()).total).toBe(antes + 1);
      expect((await repo.stats()).bloqueados).toBe(1);
    });
  });

  describe('generateNumeroLote', () => {
    it('produce formato FT-AAAA-####', async () => {
      const num = await repo.generateNumeroLote();
      expect(num).toMatch(/^FT-\d{4}-\d{4}$/);
    });
    it('arranca desde seq 45 despues de los 5 seed', async () => {
      const num = await repo.generateNumeroLote();
      expect(num).toMatch(/-0045$/);
    });
  });

  describe('exports auxiliares', () => {
    it('exporta ESTADOS con 8 estados', () => {
      expect(Object.keys(ESTADOS).length).toBe(8);
    });
    it('cada estado tiene slug y label', () => {
      Object.values(ESTADOS).forEach(e => {
        expect(e).toHaveProperty('slug');
        expect(e).toHaveProperty('label');
      });
    });
    it('labelFor devuelve label correcto', () => {
      expect(labelFor('liberado')).toBe('Liberado');
      expect(labelFor('alerta_bpm')).toBe('Alerta BPM');
    });
    it('labelFor devuelve estado crudo si no esta en catalogo', () => {
      expect(labelFor('xyz_desconocido')).toBe('xyz_desconocido');
    });
  });
});
