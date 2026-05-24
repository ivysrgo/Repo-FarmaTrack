/**
 * tests/controllers/LoteController.test.js (async)
 */
'use strict';

const { mockReq, mockRes, mockNext } = require('../helpers/http');

let lotes;
let repo;

beforeEach(() => {
  jest.resetModules();
  process.env.USE_MEMORY_REPOS = 'true';
  lotes = require('../../src/controllers/LoteController');
  repo  = require('../../src/repositories/LoteRepository');
});

describe('LoteController (async)', () => {

  describe('getLotesActivos', () => {
    it('redirige /lotes -> /panel', () => {
      const req = mockReq();
      const res = mockRes();
      lotes.getLotesActivos(req, res);
      expect(res.redirect).toHaveBeenCalledWith('/panel');
    });
  });

  describe('getLoteDetalle', () => {
    it('redirige al paso actual', async () => {
      const req = mockReq({ params: { id: '1' } });
      const res = mockRes();
      await lotes.getLoteDetalle(req, res, mockNext());
      expect(res.redirect).toHaveBeenCalledWith('/lotes/1/paso/5');
    });
    it('404 si no existe', async () => {
      const req = mockReq({ params: { id: '9999' } });
      const next = mockNext();
      await lotes.getLoteDetalle(req, mockRes(), next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 404 }));
    });
  });

  describe('getPaso', () => {
    it('renderiza lotes/pasoN', async () => {
      const req = mockReq({ params: { id: '1', n: '5' } });
      const res = mockRes();
      await lotes.getPaso(req, res, mockNext());
      expect(res.render).toHaveBeenCalledWith('lotes/paso5', expect.objectContaining({
        layout: 'layouts/main', paso: 5, nombrePaso: 'Controles de calidad',
      }));
    });
    it('redirige al paso actual si n>9', async () => {
      const req = mockReq({ params: { id: '1', n: '99' } });
      const res = mockRes();
      await lotes.getPaso(req, res, mockNext());
      expect(res.redirect).toHaveBeenCalledWith('/lotes/1/paso/5');
    });
    it('redirige si n=0', async () => {
      const req = mockReq({ params: { id: '1', n: '0' } });
      const res = mockRes();
      await lotes.getPaso(req, res, mockNext());
      expect(res.redirect).toHaveBeenCalledWith('/lotes/1/paso/5');
    });
    it('redirige si n no numerico', async () => {
      const req = mockReq({ params: { id: '1', n: 'abc' } });
      const res = mockRes();
      await lotes.getPaso(req, res, mockNext());
      expect(res.redirect).toHaveBeenCalledWith('/lotes/1/paso/5');
    });
    it('404 si lote no existe', async () => {
      const next = mockNext();
      await lotes.getPaso(mockReq({ params: { id: '999', n: '1' } }), mockRes(), next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 404 }));
    });
  });

  describe('postPaso', () => {
    it('avanza al siguiente paso si n < 9', async () => {
      const req = mockReq({ params: { id: '1', n: '5' } });
      const res = mockRes();
      await lotes.postPaso(req, res);
      expect(res.redirect).toHaveBeenCalledWith('/lotes/1/paso/6');
    });
    it('en paso 9 se queda en 9', async () => {
      const req = mockReq({ params: { id: '1', n: '9' } });
      const res = mockRes();
      await lotes.postPaso(req, res);
      expect(res.redirect).toHaveBeenCalledWith('/lotes/1/paso/9');
    });
    it('si lote no existe -> /panel', async () => {
      const req = mockReq({ params: { id: '999', n: '5' } });
      const res = mockRes();
      await lotes.postPaso(req, res);
      expect(res.redirect).toHaveBeenCalledWith('/panel');
    });
  });

  describe('liberarLote', () => {
    it('libera lote y redirige a /panel para DT', async () => {
      const req = mockReq({ params: { id: '1' } });
      const res = mockRes({ locals: { currentUser: { nombre: 'Juan Bahos', rol: 'director_tecnico' } } });
      await lotes.liberarLote(req, res, mockNext());
      const l = await repo.findById(1);
      expect(l.estado).toBe('liberado');
      expect(l.liberadoPor).toBe('Juan Bahos');
      expect(l.pasoActual).toBe(9);
      expect(res.redirect).toHaveBeenCalledWith('/panel');
    });
    it('operario -> /mis-lotes', async () => {
      const req = mockReq({ params: { id: '1' } });
      const res = mockRes({ locals: { currentUser: { nombre: 'Sergio', rol: 'operario' } } });
      await lotes.liberarLote(req, res, mockNext());
      expect(res.redirect).toHaveBeenCalledWith('/mis-lotes');
    });
    it('flash de exito con numero de lote', async () => {
      const req = mockReq({ params: { id: '1' } });
      const res = mockRes({ locals: { currentUser: { nombre: 'Juan Bahos', rol: 'director_tecnico' } } });
      await lotes.liberarLote(req, res, mockNext());
      expect(req.flash).toHaveBeenCalledWith('ok', expect.stringMatching(/FT-2026-0041/));
    });
    it('lote ya liberado -> flash error', async () => {
      const req = mockReq({ params: { id: '4' } });
      const res = mockRes({ locals: { currentUser: { nombre: 'Juan', rol: 'director_tecnico' } } });
      await lotes.liberarLote(req, res, mockNext());
      expect(req.flash).toHaveBeenCalledWith('error', expect.stringMatching(/ya estaba liberado/i));
      expect(res.redirect).toHaveBeenCalledWith('/lotes/4/paso/9');
    });
    it('lote rechazado -> flash error', async () => {
      await repo.update(1, { estado: 'rechazado' });
      const req = mockReq({ params: { id: '1' } });
      const res = mockRes({ locals: { currentUser: { nombre: 'Juan', rol: 'director_tecnico' } } });
      await lotes.liberarLote(req, res, mockNext());
      expect(req.flash).toHaveBeenCalledWith('error', expect.stringMatching(/rechazado/i));
      expect((await repo.findById(1)).estado).toBe('rechazado');
    });
    it('404 si no existe', async () => {
      const next = mockNext();
      await lotes.liberarLote(mockReq({ params: { id: '999' } }), mockRes(), next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 404 }));
    });
    it('liberadoEn en formato ISO', async () => {
      const req = mockReq({ params: { id: '1' } });
      const res = mockRes({ locals: { currentUser: { nombre: 'Juan', rol: 'director_tecnico' } } });
      await lotes.liberarLote(req, res, mockNext());
      expect((await repo.findById(1)).liberadoEn).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe('getNuevoLote', () => {
    it('renderiza lotes/nuevo con errores y values vacios', async () => {
      const req = mockReq();
      const res = mockRes();
      await lotes.getNuevoLote(req, res);
      expect(res.render).toHaveBeenCalledWith('lotes/nuevo', expect.objectContaining({
        layout: 'layouts/main', errores: [], values: {},
      }));
    });
  });

  describe('postNuevoLote - validacion', () => {
    it('422 si faltan campos', async () => {
      const req = mockReq({ body: {} });
      const res = mockRes();
      await lotes.postNuevoLote(req, res);
      expect(res.status).toHaveBeenCalledWith(422);
      const args = res.render.mock.calls[0][1];
      expect(args.errores.length).toBeGreaterThan(0);
    });
    it('rechaza cantidad < 100', async () => {
      const req = mockReq({ body: {
        numeroOrden: 'OP-1', codigoLote: 'FT-1', producto: 'X', cantidad: '50',
        fechaInicio: '2026-05-22', operario: 'a', jefeCalidad: 'b', area: 'c',
        confirmFormula: '1', confirmMaterias: '1', confirmEquipos: '1',
      }});
      const res = mockRes();
      await lotes.postNuevoLote(req, res);
      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.render.mock.calls[0][1].errores.some(e => /cantidad/i.test(e))).toBe(true);
    });
    it('exige las 3 confirmaciones', async () => {
      const req = mockReq({ body: {
        numeroOrden: 'OP-1', codigoLote: 'FT-1', producto: 'X', cantidad: '500',
        fechaInicio: '2026-05-22', operario: 'a', jefeCalidad: 'b', area: 'c',
      }});
      const res = mockRes();
      await lotes.postNuevoLote(req, res);
      const errs = res.render.mock.calls[0][1].errores;
      expect(errs.some(e => /f[oó]rmula/i.test(e))).toBe(true);
      expect(errs.some(e => /materias/i.test(e))).toBe(true);
      expect(errs.some(e => /equipos/i.test(e))).toBe(true);
    });
    it('crea lote OK y redirige a /panel', async () => {
      const before = (await repo.findAll()).length;
      const req = mockReq({ body: {
        numeroOrden: 'OP-2026-100', codigoLote: 'FT-2026-0100', producto: 'Paracetamol',
        formaFarmaceutica: 'Tabletas', concentracion: '500 mg', cantidad: '10000',
        fechaInicio: '2026-05-22', operario: 'Test Op', jefeCalidad: 'Test QA', area: 'Solidos',
        confirmFormula: '1', confirmMaterias: '1', confirmEquipos: '1',
      }});
      const res = mockRes();
      await lotes.postNuevoLote(req, res);
      expect((await repo.findAll()).length).toBe(before + 1);
      expect(req.flash).toHaveBeenCalledWith('ok', expect.stringMatching(/OP-2026-100/));
      expect(res.redirect).toHaveBeenCalledWith('/panel');
    });
    it('modoBorrador NO persiste, redirige', async () => {
      const before = (await repo.findAll()).length;
      const req = mockReq({ body: { modoBorrador: '1', numeroOrden: 'OP-X' } });
      const res = mockRes();
      await lotes.postNuevoLote(req, res);
      expect((await repo.findAll()).length).toBe(before);
      expect(res.redirect).toHaveBeenCalledWith('/panel');
    });
  });
});
