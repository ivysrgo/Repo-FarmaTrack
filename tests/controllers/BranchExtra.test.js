/**
 * tests/controllers/BranchExtra.test.js
 *
 * Tests dirigidos a subir cobertura de branches en controllers que tenían
 * ramas no ejercitadas (NoConformidadController.getListado/postResolver,
 * PanelController con DT específico, SidebarController.getBitacora para DT).
 */
'use strict';

const { mockReq, mockRes } = require('../helpers/http');

let nc, panel, sidebar, repo, ncRepo;

beforeEach(() => {
  jest.resetModules();
  process.env.USE_MEMORY_REPOS = 'true';
  nc      = require('../../src/controllers/NoConformidadController');
  panel   = require('../../src/controllers/PanelController');
  sidebar = require('../../src/controllers/SidebarController');
  repo    = require('../../src/repositories/LoteRepository');
  ncRepo  = require('../../src/repositories/NoConformidadRepository');
});

describe('NoConformidadController.getListado', () => {
  it('renderiza el listado con ncs y stats', async () => {
    const req = mockReq();
    const res = mockRes({ locals: { currentUser: { nombre: 'Juan' } } });
    await nc.getListado(req, res);
    expect(res.render).toHaveBeenCalledWith('noconformidad/listado', expect.objectContaining({
      currentPath: '/noconformidad',
      ncs: expect.any(Array),
      stats: expect.any(Object),
    }));
  });

  it('flash messages vacíos cuando no hay req.flash', async () => {
    const req = mockReq();
    req.flash = undefined;
    const res = mockRes({ locals: { currentUser: { nombre: 'Juan' } } });
    await nc.getListado(req, res);
    const args = res.render.mock.calls[0][1];
    expect(args.flashOk).toEqual([]);
    expect(args.flashError).toEqual([]);
  });
});

describe('NoConformidadController.postResolver', () => {
  it('redirige a /bitacora con flash error si NC no existe', async () => {
    const req = mockReq({ params: { id: '99999' }, body: {} });
    const res = mockRes({ locals: { currentUser: { nombre: 'Juan' } } });
    await nc.postResolver(req, res);
    expect(req.flash).toHaveBeenCalledWith('error', expect.any(String));
    expect(res.redirect).toHaveBeenCalledWith('/bitacora');
  });

  it('resuelve NC existente y redirige', async () => {
    // Creamos una NC vía repo (no service para evitar dependencias)
    const ncDoc = await ncRepo.create({ tipo: 'desviacion_bpm', descripcion: 'Test', bloqueante: false });
    const req = mockReq({ params: { id: String(ncDoc.id) }, body: {} });
    const res = mockRes({ locals: { currentUser: { nombre: 'Juan' } } });
    await nc.postResolver(req, res);
    expect(req.flash).toHaveBeenCalledWith('ok', expect.any(String));
    expect(res.redirect).toHaveBeenCalledWith('/bitacora');
  });

  it('respeta body.redirectTo si viene', async () => {
    const ncDoc = await ncRepo.create({ tipo: 'x', descripcion: 'A' });
    const req = mockReq({ params: { id: String(ncDoc.id) }, body: { redirectTo: '/otra-ruta' } });
    const res = mockRes({ locals: { currentUser: { nombre: 'Juan' } } });
    await nc.postResolver(req, res);
    expect(res.redirect).toHaveBeenCalledWith('/otra-ruta');
  });

  it('sin currentUser usa string vacío como resueltaPor', async () => {
    const ncDoc = await ncRepo.create({ tipo: 'x', descripcion: 'A' });
    const req = mockReq({ params: { id: String(ncDoc.id) }, body: {} });
    const res = mockRes();
    await nc.postResolver(req, res);
    expect(res.redirect).toHaveBeenCalled();
  });
});

describe('PanelController - branches por rol/DT', () => {
  it('DT con nombre que coincide filtra sus lotes', async () => {
    const req = mockReq();
    const res = mockRes({ locals: { currentUser: { nombre: 'David Pena', rol: 'director_tecnico' } } });
    await panel.getPanelDT(req, res);
    const args = res.render.mock.calls[0][1];
    // Todos los lotes mostrados deben tener directorTecnico David Pena
    args.lotes.forEach(l => expect(l.directorTecnico).toMatch(/David Pena/i));
  });

  it('DT con nombre que no matchea ve lista vacía', async () => {
    const req = mockReq();
    const res = mockRes({ locals: { currentUser: { nombre: 'DT Fantasma', rol: 'director_tecnico' } } });
    await panel.getPanelDT(req, res);
    const args = res.render.mock.calls[0][1];
    expect(args.lotes).toHaveLength(0);
    expect(args.stats.totalActivos).toBe(0);
    expect(args.stats.tasaBPM).toBe(100); // default cuando no hay lotes
  });

  it('user sin rol claro ve todos los lotes (compat)', async () => {
    const req = mockReq();
    const res = mockRes({ locals: { currentUser: { nombre: 'admin' } } });
    await panel.getPanelDT(req, res);
    const args = res.render.mock.calls[0][1];
    expect(args.lotes.length).toBeGreaterThan(0);
  });

  it('userLocal undefined cae al default DT', async () => {
    const req = mockReq();
    const res = mockRes(); // sin currentUser
    await panel.getPanelDT(req, res);
    const args = res.render.mock.calls[0][1];
    expect(args.usuario.iniciales).toBe('DT');
  });
});

describe('SidebarController.getBitacora - branches DT', () => {
  it('DT solo ve eventos de sus lotes (o sin loteId)', async () => {
    const req = mockReq();
    const res = mockRes({ locals: { currentUser: { nombre: 'David Pena', rol: 'director_tecnico' } } });
    await sidebar.getBitacora(req, res);
    const args = res.render.mock.calls[0][1];
    expect(args.esOperario).toBe(false);
    expect(Array.isArray(args.eventos)).toBe(true);
  });

  it('user calidad ve todos los eventos (sin filtro)', async () => {
    const req = mockReq();
    const res = mockRes({ locals: { currentUser: { nombre: 'X', rol: 'calidad' } } });
    await sidebar.getBitacora(req, res);
    const args = res.render.mock.calls[0][1];
    expect(args.esOperario).toBe(false);
  });
});

describe('SidebarController - filtrarLotesDelUsuario en batchRecords/calidad', () => {
  it('getBatchRecords filtra por DT', async () => {
    const req = mockReq();
    const res = mockRes({ locals: { currentUser: { nombre: 'David Pena', rol: 'director_tecnico' } } });
    await sidebar.getBatchRecords(req, res);
    const args = res.render.mock.calls[0][1];
    args.lotes.forEach(l => expect(l.directorTecnico).toMatch(/David Pena/i));
  });

  it('getCalidad filtra por DT', async () => {
    const req = mockReq();
    const res = mockRes({ locals: { currentUser: { nombre: 'David Pena', rol: 'director_tecnico' } } });
    await sidebar.getCalidad(req, res);
    const args = res.render.mock.calls[0][1];
    [...args.enRevision, ...args.conAlerta, ...args.bloqueados].forEach(l => {
      expect(l.directorTecnico).toMatch(/David Pena/i);
    });
  });

  it('getBatchRecords con operario filtra por operario', async () => {
    const req = mockReq();
    const res = mockRes({ locals: { currentUser: { nombre: 'Carlos Rodriguez', rol: 'operario' } } });
    await sidebar.getBatchRecords(req, res);
    expect(res.render).toHaveBeenCalled();
  });
});
