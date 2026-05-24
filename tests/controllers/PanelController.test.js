/**
 * tests/controllers/PanelController.test.js (async)
 */
'use strict';

const { mockReq, mockRes } = require('../helpers/http');

let panel;
let repo;

beforeEach(() => {
  jest.resetModules();
  process.env.USE_MEMORY_REPOS = 'true';
  panel = require('../../src/controllers/PanelController');
  repo  = require('../../src/repositories/LoteRepository');
});

describe('PanelController (async)', () => {
  describe('getPanelDT', () => {
    it('renderiza panel/index con currentPath /panel', async () => {
      const req = mockReq();
      const res = mockRes({ locals: { currentUser: { nombre: 'Juan Bahos', rol: 'director_tecnico' } } });
      await panel.getPanelDT(req, res);
      expect(res.render).toHaveBeenCalledWith('panel/index', expect.objectContaining({ currentPath: '/panel' }));
    });
    it('pasa los 5 lotes seed', async () => {
      const req = mockReq();
      const res = mockRes({ locals: { currentUser: { nombre: 'Juan' } } });
      await panel.getPanelDT(req, res);
      expect(res.render.mock.calls[0][1].lotes).toHaveLength(5);
    });
    it('stats coinciden con repo.stats()', async () => {
      const req = mockReq();
      const res = mockRes({ locals: { currentUser: { nombre: 'Juan' } } });
      await panel.getPanelDT(req, res);
      const args = res.render.mock.calls[0][1];
      const real = await repo.stats();
      expect(args.stats.totalActivos).toBe(real.total);
      expect(args.stats.pendientesFirma).toBe(real.pendientesFirma);
      expect(args.stats.alertasBPM).toBe(real.alertasBPM);
    });
    it('tabCounts: en_produccion incluye alertasBPM', async () => {
      const req = mockReq();
      const res = mockRes({ locals: { currentUser: { nombre: 'Juan' } } });
      await panel.getPanelDT(req, res);
      const args = res.render.mock.calls[0][1];
      const real = await repo.stats();
      expect(args.tabCounts.en_produccion).toBe(real.enProduccion + real.alertasBPM);
      expect(args.tabCounts.todos).toBe(real.total);
    });
    it('iniciales del usuario', async () => {
      const req = mockReq();
      const res = mockRes({ locals: { currentUser: { nombre: 'Juan Bahos' } } });
      await panel.getPanelDT(req, res);
      expect(res.render.mock.calls[0][1].usuario.iniciales).toBe('JB');
    });
    it('fallback Director Tecnico sin currentUser', async () => {
      const req = mockReq();
      const res = mockRes();
      await panel.getPanelDT(req, res);
      expect(res.render.mock.calls[0][1].usuario.nombre).toBe('Director Tecnico');
    });
    it('fecha en formato es-CO', async () => {
      const req = mockReq();
      const res = mockRes({ locals: { currentUser: { nombre: 'Juan' } } });
      await panel.getPanelDT(req, res);
      const args = res.render.mock.calls[0][1];
      expect(args.fechaHoy).toEqual(expect.any(String));
      expect(args.fechaHoy).toContain('·');
    });
    it('flash vacio cuando no hay mensajes', async () => {
      const req = mockReq();
      const res = mockRes({ locals: { currentUser: { nombre: 'Juan' } } });
      await panel.getPanelDT(req, res);
      const args = res.render.mock.calls[0][1];
      expect(args.flashOk).toEqual([]);
      expect(args.flashError).toEqual([]);
    });
    it('nuevos lotes aparecen automaticamente', async () => {
      const antes = (await repo.findAll()).length;
      await repo.create({ numeroOrden: 'OP-X', numeroLote: 'FT-TEST-999', producto: 'TestMed', cantidadPlanificada: 1000, estado: 'en_produccion' });
      const req = mockReq();
      const res = mockRes({ locals: { currentUser: { nombre: 'Juan' } } });
      await panel.getPanelDT(req, res);
      const args = res.render.mock.calls[0][1];
      expect(args.lotes.length).toBe(antes + 1);
      expect(args.lotes.some(l => l.numeroLote === 'FT-TEST-999')).toBe(true);
    });
  });
});
