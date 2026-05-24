/**
 * tests/controllers/OperarioController.test.js (async)
 */
'use strict';

const { mockReq, mockRes, mockNext } = require('../helpers/http');

let operario;
let repo;

beforeEach(() => {
  jest.resetModules();
  process.env.USE_MEMORY_REPOS = 'true';
  operario = require('../../src/controllers/OperarioController');
  repo     = require('../../src/repositories/LoteRepository');
});

describe('OperarioController (async)', () => {

  describe('getDashboard', () => {
    it('renderiza operario/dashboard con datos del usuario', async () => {
      const req = mockReq();
      const res = mockRes({ locals: { currentUser: { nombre: 'Carlos Rodriguez', cargo: 'Operario' } } });
      await operario.getDashboard(req, res);
      expect(res.render).toHaveBeenCalledWith('operario/dashboard', expect.objectContaining({
        currentPath: '/mis-lotes',
        usuario: expect.objectContaining({ nombre: 'Carlos Rodriguez' }),
      }));
    });
    it('filtra lotes asignados al operario', async () => {
      const req = mockReq();
      const res = mockRes({ locals: { currentUser: { nombre: 'Carlos Rodriguez' } } });
      await operario.getDashboard(req, res);
      const args = res.render.mock.calls[0][1];
      expect(args.activos.some(l => l.numeroLote === 'FT-2026-0041')).toBe(true);
    });
    it('usuario sin lotes asignados ve dashboard vacío (sin fallback demo)', async () => {
      const req = mockReq();
      const res = mockRes({ locals: { currentUser: { nombre: 'Nadie' } } });
      await operario.getDashboard(req, res);
      const args = res.render.mock.calls[0][1];
      expect(args.activos.length).toBe(0);
      expect(args.completadosHoy.length).toBe(0);
    });
    it('progresoPct entre 0-100', async () => {
      const req = mockReq();
      const res = mockRes({ locals: { currentUser: { nombre: 'Carlos Rodriguez' } } });
      await operario.getDashboard(req, res);
      const args = res.render.mock.calls[0][1];
      args.activos.forEach(l => {
        expect(l.progresoPct).toBeGreaterThanOrEqual(0);
        expect(l.progresoPct).toBeLessThanOrEqual(100);
      });
    });
    it('iniciales 2 letras mayusculas', async () => {
      const req = mockReq();
      const res = mockRes({ locals: { currentUser: { nombre: 'Sergio Velandia' } } });
      await operario.getDashboard(req, res);
      expect(res.render.mock.calls[0][1].usuario.iniciales).toBe('SV');
    });
  });

  describe('getPaso', () => {
    it('renderiza operario/pasos/pasoN', async () => {
      const req = mockReq({ params: { id: '1', n: '3' } });
      const res = mockRes({ locals: { currentUser: { nombre: 'Carlos' } } });
      await operario.getPaso(req, res, mockNext());
      expect(res.render).toHaveBeenCalledWith('operario/pasos/paso3', expect.objectContaining({
        paso: 3, nombrePaso: 'Verificacion de pesos',
      }));
    });
    it('BLOQUEA avance a pasos futuros', async () => {
      const req = mockReq({ params: { id: '1', n: '8' } });
      const res = mockRes({ locals: { currentUser: { nombre: 'Carlos' } } });
      await operario.getPaso(req, res, mockNext());
      expect(res.redirect).toHaveBeenCalledWith('/mis-lotes/1/paso/5');
      expect(res.render).not.toHaveBeenCalled();
    });
    it('redirige si n invalido', async () => {
      const req = mockReq({ params: { id: '1', n: 'abc' } });
      const res = mockRes();
      await operario.getPaso(req, res, mockNext());
      expect(res.redirect).toHaveBeenCalledWith('/mis-lotes/1/paso/5');
    });
    it('404 si no existe', async () => {
      const next = mockNext();
      await operario.getPaso(mockReq({ params: { id: '999', n: '1' } }), mockRes(), next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 404 }));
    });
  });

  describe('postPaso - pasos 1-8', () => {
    it('avanza paso y persiste', async () => {
      const req = mockReq({ params: { id: '1', n: '5' }, body: { observaciones: 'OK' } });
      const res = mockRes();
      await operario.postPaso(req, res, mockNext());
      expect((await repo.findById(1)).pasoActual).toBe(6);
      expect(res.redirect).toHaveBeenCalledWith('/mis-lotes/1/paso/6');
    });
    it('guarda observaciones', async () => {
      const req = mockReq({ params: { id: '1', n: '5' }, body: { observaciones: 'comentario' } });
      const res = mockRes();
      await operario.postPaso(req, res, mockNext());
      expect((await repo.findById(1)).observaciones).toBe('comentario');
    });
    it('en_espera -> en_produccion al avanzar', async () => {
      await repo.update(5, { estado: 'en_espera', pasoActual: 1 });
      const req = mockReq({ params: { id: '5', n: '1' }, body: {} });
      const res = mockRes();
      await operario.postPaso(req, res, mockNext());
      expect((await repo.findById(5)).estado).toBe('en_produccion');
    });
    it('404 si no existe', async () => {
      const next = mockNext();
      await operario.postPaso(mockReq({ params: { id: '999', n: '5' }, body: {} }), mockRes(), next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 404 }));
    });
    it('redirige al paso actual si n invalido', async () => {
      const req = mockReq({ params: { id: '1', n: '99' }, body: {} });
      const res = mockRes();
      const before = (await repo.findById(1)).pasoActual;
      await operario.postPaso(req, res, mockNext());
      expect(res.redirect).toHaveBeenCalledWith(`/mis-lotes/1/paso/${before}`);
    });
  });

  describe('postPaso - paso 9 (notifica DT)', () => {
    it('marca pendiente_firma y redirige a /mis-lotes', async () => {
      await repo.update(1, { estado: 'en_produccion', pasoActual: 8 });
      const req = mockReq({ params: { id: '1', n: '9' }, body: { observaciones: 'listo' } });
      const res = mockRes();
      await operario.postPaso(req, res, mockNext());
      expect((await repo.findById(1)).estado).toBe('pendiente_firma');
      expect((await repo.findById(1)).pasoActual).toBe(9);
      expect(res.redirect).toHaveBeenCalledWith('/mis-lotes');
    });
    it('flash informa al operario', async () => {
      await repo.update(1, { estado: 'en_produccion' });
      const req = mockReq({ params: { id: '1', n: '9' }, body: {} });
      const res = mockRes();
      await operario.postPaso(req, res, mockNext());
      expect(req.flash).toHaveBeenCalledWith('ok', expect.stringMatching(/Director Tecnico/));
    });
    it('NO re-notifica si ya pendiente_firma', async () => {
      const req = mockReq({ params: { id: '2', n: '9' }, body: {} });
      const res = mockRes();
      await operario.postPaso(req, res, mockNext());
      expect(req.flash).toHaveBeenCalledWith('error', expect.stringMatching(/ya fue notificado/i));
      expect(res.redirect).toHaveBeenCalledWith('/mis-lotes/2/paso/9');
    });
    it('NO renotifica liberado', async () => {
      const req = mockReq({ params: { id: '4', n: '9' }, body: {} });
      const res = mockRes();
      await operario.postPaso(req, res, mockNext());
      expect(req.flash).toHaveBeenCalledWith('error', expect.any(String));
      expect((await repo.findById(4)).estado).toBe('liberado');
    });
  });
});
