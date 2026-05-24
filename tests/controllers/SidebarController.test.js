/**
 * tests/controllers/SidebarController.test.js (async)
 */
'use strict';

const { mockReq, mockRes } = require('../helpers/http');

let sidebar;
let repo;

beforeEach(() => {
  jest.resetModules();
  process.env.USE_MEMORY_REPOS = 'true';
  sidebar = require('../../src/controllers/SidebarController');
  repo    = require('../../src/repositories/LoteRepository');
});

describe('SidebarController (async)', () => {

  describe('getBatchRecords', () => {
    it('renderiza con solo lotes liberados', async () => {
      const req = mockReq();
      const res = mockRes({ locals: { currentUser: { nombre: 'Juan' } } });
      await sidebar.getBatchRecords(req, res);
      expect(res.render).toHaveBeenCalledWith('sistema/batch-records', expect.objectContaining({ currentPath: '/batch-records' }));
      const args = res.render.mock.calls[0][1];
      args.lotes.forEach(l => expect(l.estado).toBe('liberado'));
    });
    it('stats.total = liberados del repo', async () => {
      const req = mockReq();
      const res = mockRes({ locals: { currentUser: { nombre: 'Juan' } } });
      await sidebar.getBatchRecords(req, res);
      const args = res.render.mock.calls[0][1];
      expect(args.stats.total).toBe((await repo.stats()).liberados);
    });
  });

  describe('getCalidad', () => {
    it('separa lotes por estado', async () => {
      const req = mockReq();
      const res = mockRes({ locals: { currentUser: { nombre: 'Juan' } } });
      await sidebar.getCalidad(req, res);
      const args = res.render.mock.calls[0][1];
      args.enRevision.forEach(l => expect(l.estado).toBe('en_calidad'));
      args.conAlerta.forEach(l => expect(l.estado).toBe('alerta_bpm'));
      args.bloqueados.forEach(l => expect(l.estado).toBe('bloqueado'));
    });
    it('currentPath /calidad', async () => {
      const req = mockReq();
      const res = mockRes({ locals: { currentUser: { nombre: 'Juan' } } });
      await sidebar.getCalidad(req, res);
      expect(res.render).toHaveBeenCalledWith('sistema/calidad', expect.objectContaining({ currentPath: '/calidad' }));
    });
    it('stats reflejan conteos', async () => {
      const req = mockReq();
      const res = mockRes({ locals: { currentUser: { nombre: 'Juan' } } });
      await sidebar.getCalidad(req, res);
      const args = res.render.mock.calls[0][1];
      expect(args.stats.enRevision).toBe(args.enRevision.length);
      expect(args.stats.alertas).toBe(args.conAlerta.length);
      expect(args.stats.bloqueados).toBe(args.bloqueados.length);
    });
  });

  describe('getInventario', () => {
    it('renderiza con materias del repo', async () => {
      const req = mockReq();
      const res = mockRes({ locals: { currentUser: { nombre: 'Juan' } } });
      await sidebar.getInventario(req, res);
      expect(res.render).toHaveBeenCalledWith('sistema/inventario', expect.objectContaining({ currentPath: '/inventario' }));
      expect(res.render.mock.calls[0][1].materias.length).toBeGreaterThan(0);
    });
    it('cuenta bajos y agotados', async () => {
      const req = mockReq();
      const res = mockRes({ locals: { currentUser: { nombre: 'Juan' } } });
      await sidebar.getInventario(req, res);
      const args = res.render.mock.calls[0][1];
      const bajos    = args.materias.filter(m => m.estado === 'bajo').length;
      const agotados = args.materias.filter(m => m.estado === 'agotado').length;
      expect(args.stats.bajos).toBe(bajos);
      expect(args.stats.agotados).toBe(agotados);
    });
    it('cada materia tiene campos requeridos', async () => {
      const req = mockReq();
      const res = mockRes({ locals: { currentUser: { nombre: 'Juan' } } });
      await sidebar.getInventario(req, res);
      res.render.mock.calls[0][1].materias.forEach(m => {
        expect(m).toHaveProperty('codigo');
        expect(m).toHaveProperty('nombre');
        expect(m).toHaveProperty('stockKg');
        expect(m).toHaveProperty('estado');
      });
    });
  });

  describe('getBitacora', () => {
    it('renderiza vista con esOperario=false para DT (eventos pueden estar vacios)', async () => {
      const req = mockReq();
      const res = mockRes({ locals: { currentUser: { nombre: 'Juan', rol: 'director_tecnico' } } });
      await sidebar.getBitacora(req, res);
      const args = res.render.mock.calls[0][1];
      expect(args.esOperario).toBe(false);
      expect(Array.isArray(args.eventos)).toBe(true);
    });
    it('FILTRA para operario: cada evento debe ser suyo o de Sistema', async () => {
      const req = mockReq();
      const res = mockRes({ locals: { currentUser: { nombre: 'Carlos Rodriguez', rol: 'operario' } } });
      await sidebar.getBitacora(req, res);
      const args = res.render.mock.calls[0][1];
      expect(args.esOperario).toBe(true);
      args.eventos.forEach(e => {
        expect(['Carlos Rodriguez', 'Sistema']).toContain(e.usuario);
      });
    });
    it('operario sin eventos propios solo ve los de Sistema', async () => {
      const req = mockReq();
      const res = mockRes({ locals: { currentUser: { nombre: 'Nadie', rol: 'operario' } } });
      await sidebar.getBitacora(req, res);
      const args = res.render.mock.calls[0][1];
      args.eventos.forEach(e => expect(e.usuario).toBe('Sistema'));
    });
  });

  describe('getReportes', () => {
    it('4 cards de reporte', async () => {
      const req = mockReq();
      const res = mockRes({ locals: { currentUser: { nombre: 'Juan' } } });
      await sidebar.getReportes(req, res);
      expect(res.render.mock.calls[0][1].reportes).toHaveLength(4);
    });
    it('cada reporte tiene titulo/descripcion/meta/icono', async () => {
      const req = mockReq();
      const res = mockRes({ locals: { currentUser: { nombre: 'Juan' } } });
      await sidebar.getReportes(req, res);
      res.render.mock.calls[0][1].reportes.forEach(r => {
        expect(r).toHaveProperty('titulo');
        expect(r).toHaveProperty('descripcion');
        expect(r).toHaveProperty('meta');
        expect(r).toHaveProperty('icono');
      });
    });
    it('reporte mensual incluye total del repo', async () => {
      const req = mockReq();
      const res = mockRes({ locals: { currentUser: { nombre: 'Juan' } } });
      await sidebar.getReportes(req, res);
      const args = res.render.mock.calls[0][1];
      expect(args.reportes[0].meta).toContain(String((await repo.stats()).total));
    });
  });

  describe('getConfiguracion', () => {
    it('renderiza con perfil del usuario', () => {
      const req = mockReq();
      const res = mockRes({ locals: { currentUser: { nombre: 'Juan Bahos', email: 'juan@x.co', rol: 'director_tecnico', cargo: 'DT' } } });
      sidebar.getConfiguracion(req, res);
      const args = res.render.mock.calls[0][1];
      expect(args.perfil.nombre).toBe('Juan Bahos');
      expect(args.perfil.email).toBe('juan@x.co');
      expect(args.perfil.rolLabel).toBe('Director Tecnico');
    });
    it('traduce rol operario', () => {
      const req = mockReq();
      const res = mockRes({ locals: { currentUser: { nombre: 'X', rol: 'operario' } } });
      sidebar.getConfiguracion(req, res);
      expect(res.render.mock.calls[0][1].perfil.rolLabel).toBe('Operario de Produccion');
    });
    it('fallback - para email y cargo', () => {
      const req = mockReq();
      const res = mockRes();
      sidebar.getConfiguracion(req, res);
      const args = res.render.mock.calls[0][1];
      expect(args.perfil.email).toBe('-');
      expect(args.perfil.cargo).toBe('-');
    });
    it('info de sistema', () => {
      const req = mockReq();
      const res = mockRes({ locals: { currentUser: { nombre: 'Juan' } } });
      sidebar.getConfiguracion(req, res);
      const args = res.render.mock.calls[0][1];
      expect(args.sistema.app).toBe('FarmaTrack');
      expect(args.sistema.version).toBe('1.0.0');
    });
  });
});
rsion).toBe('1.0.0');
    });
  });
});
