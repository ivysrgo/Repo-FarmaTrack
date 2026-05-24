/**
 * tests/controllers/NoConformidadController.test.js (async)
 */
'use strict';

const { mockReq, mockRes } = require('../helpers/http');

let nc;
let repo;

beforeEach(() => {
  jest.resetModules();
  process.env.USE_MEMORY_REPOS = 'true';
  nc   = require('../../src/controllers/NoConformidadController');
  repo = require('../../src/repositories/LoteRepository');
});

describe('NoConformidadController (async)', () => {

  describe('getNueva', () => {
    it('renderiza con lotes activos', async () => {
      const req = mockReq();
      const res = mockRes({ locals: { currentUser: { nombre: 'Juan' } } });
      await nc.getNueva(req, res);
      expect(res.render).toHaveBeenCalledWith('noconformidad/nueva', expect.objectContaining({
        currentPath: '/noconformidad',
      }));
    });
    it('filtra solo lotes en estados activos', async () => {
      const req = mockReq();
      const res = mockRes({ locals: { currentUser: { nombre: 'Juan' } } });
      await nc.getNueva(req, res);
      const args = res.render.mock.calls[0][1];
      args.lotesActivos.forEach(l => {
        expect(['liberado', 'rechazado']).not.toContain(l.estado);
      });
    });
    it('incluye flash errores', async () => {
      const req = mockReq();
      req.flash.mockImplementation(k => k === 'error' ? ['Fallo'] : []);
      const res = mockRes({ locals: { currentUser: { nombre: 'Juan' } } });
      await nc.getNueva(req, res);
      expect(res.render.mock.calls[0][1].errores).toEqual(['Fallo']);
    });
    it('genera iniciales del usuario', async () => {
      const req = mockReq();
      const res = mockRes({ locals: { currentUser: { nombre: 'Sergio Velandia' } } });
      await nc.getNueva(req, res);
      expect(res.render.mock.calls[0][1].usuario.iniciales).toBe('SV');
    });
    it('fallback Usuario si no hay sesion', async () => {
      const req = mockReq();
      const res = mockRes();
      await nc.getNueva(req, res);
      expect(res.render.mock.calls[0][1].usuario.nombre).toBe('Usuario');
    });
  });

  describe('postNueva - validacion', () => {
    it('rechaza si falta tipo', async () => {
      const req = mockReq({ body: { descripcion: 'algo' } });
      const res = mockRes();
      await nc.postNueva(req, res);
      expect(req.flash).toHaveBeenCalledWith('error', expect.stringMatching(/tipo/i));
      expect(res.redirect).toHaveBeenCalledWith('/noconformidad/nueva');
    });
    it('rechaza si falta descripcion', async () => {
      const req = mockReq({ body: { tipo: 'desv' } });
      const res = mockRes();
      await nc.postNueva(req, res);
      expect(req.flash).toHaveBeenCalledWith('error', expect.stringMatching(/descripci/i));
      expect(res.redirect).toHaveBeenCalledWith('/noconformidad/nueva');
    });
    it('rechaza si descripcion solo espacios', async () => {
      const req = mockReq({ body: { tipo: 'desv', descripcion: '   ' } });
      const res = mockRes();
      await nc.postNueva(req, res);
      expect(res.redirect).toHaveBeenCalledWith('/noconformidad/nueva');
    });
  });

  describe('postNueva - exito', () => {
    it('OK para DT -> /panel', async () => {
      const req = mockReq({ body: { tipo: 'desv', descripcion: 'Temp' } });
      const res = mockRes({ locals: { currentUser: { rol: 'director_tecnico' } } });
      await nc.postNueva(req, res);
      expect(req.flash).toHaveBeenCalledWith('ok', expect.stringMatching(/no conformidad/i));
      expect(res.redirect).toHaveBeenCalledWith('/panel');
    });
    it('OK para operario -> /mis-lotes', async () => {
      const req = mockReq({ body: { tipo: 'err', descripcion: 'algo' } });
      const res = mockRes({ locals: { currentUser: { rol: 'operario' } } });
      await nc.postNueva(req, res);
      expect(res.redirect).toHaveBeenCalledWith('/mis-lotes');
    });
    it('bloqueante=1 sobre no-liberado marca alerta_bpm', async () => {
      const req = mockReq({ body: { tipo: 'desv', descripcion: 'Critico', bloqueante: '1', loteId: '1' } });
      const res = mockRes({ locals: { currentUser: { rol: 'director_tecnico' } } });
      await nc.postNueva(req, res);
      expect((await repo.findById(1)).estado).toBe('alerta_bpm');
      expect((await repo.findById(1)).observaciones).toBe('Critico');
    });
    it('NO toca lote liberado', async () => {
      const req = mockReq({ body: { tipo: 'desv', descripcion: 'tardia', bloqueante: '1', loteId: '4' } });
      const res = mockRes({ locals: { currentUser: { rol: 'director_tecnico' } } });
      await nc.postNueva(req, res);
      expect((await repo.findById(4)).estado).toBe('liberado');
    });
    it('bloqueante=0 no toca el lote aunque envien loteId', async () => {
      const req = mockReq({ body: { tipo: 'doc', descripcion: 'menor', bloqueante: '0', loteId: '1' } });
      const res = mockRes({ locals: { currentUser: { rol: 'director_tecnico' } } });
      const antes = (await repo.findById(1)).estado;
      await nc.postNueva(req, res);
      expect((await repo.findById(1)).estado).toBe(antes);
    });
    it('loteId inexistente no revienta', async () => {
      const req = mockReq({ body: { tipo: 'desv', descripcion: 'd', bloqueante: '1', loteId: '99999' } });
      const res = mockRes({ locals: { currentUser: { rol: 'director_tecnico' } } });
      await expect(nc.postNueva(req, res)).resolves.not.toThrow();
      expect(res.redirect).toHaveBeenCalledWith('/panel');
    });
  });
});
