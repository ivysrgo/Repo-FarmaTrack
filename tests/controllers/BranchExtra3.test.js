/**
 * tests/controllers/BranchExtra3.test.js
 *
 * Cobertura fina de branches en SidebarController.getBitacora
 * (transformación de eventos: paso/ncId/puedeResolver/loteHref).
 */
'use strict';

const { mockReq, mockRes } = require('../helpers/http');

let sidebar, eventoRepo, ncRepo;

beforeEach(() => {
  jest.resetModules();
  process.env.USE_MEMORY_REPOS = 'true';
  sidebar    = require('../../src/controllers/SidebarController');
  eventoRepo = require('../../src/repositories/EventoRepository');
  ncRepo     = require('../../src/repositories/NoConformidadRepository');
});

describe('SidebarController.getBitacora - transformación de eventos', () => {
  it('evento con meta.paso válido → loteHref con paso', async () => {
    eventoRepo._items.push({
      id: 200, tipo: 'nc_reportada', texto: 'NC', usuario: 'X',
      loteId: 1, loteNumero: 'FT-001', meta: { paso: 5 }, createdAt: new Date().toISOString(),
    });
    const req = mockReq();
    const res = mockRes({ locals: { currentUser: { nombre: 'admin' } } });
    await sidebar.getBitacora(req, res);
    const args = res.render.mock.calls[0][1];
    const ev = args.eventos.find(e => e.lote === 'FT-001');
    expect(ev.loteHref).toBe('/lotes/1/paso/5');
    expect(ev.paso).toBe(5);
  });

  it('evento con loteId pero sin paso → loteHref sin paso', async () => {
    eventoRepo._items.push({
      id: 201, tipo: 'lote_creado', texto: 'X', usuario: 'X',
      loteId: 2, loteNumero: 'FT-002', meta: {}, createdAt: new Date().toISOString(),
    });
    const req = mockReq();
    const res = mockRes({ locals: { currentUser: { nombre: 'admin' } } });
    await sidebar.getBitacora(req, res);
    const args = res.render.mock.calls[0][1];
    const ev = args.eventos.find(e => e.lote === 'FT-002');
    expect(ev.loteHref).toBe('/lotes/2');
    expect(ev.paso).toBeNull();
  });

  it('evento sin loteId → loteHref null', async () => {
    eventoRepo._items.push({
      id: 202, tipo: 'lote_creado', texto: 'Z', usuario: 'X',
      loteId: null, loteNumero: '', meta: {}, createdAt: new Date().toISOString(),
    });
    const req = mockReq();
    const res = mockRes({ locals: { currentUser: { nombre: 'admin' } } });
    await sidebar.getBitacora(req, res);
    const args = res.render.mock.calls[0][1];
    const ev = args.eventos.find(e => e.texto === 'Z');
    expect(ev.loteHref).toBeNull();
  });

  it('NC reportada con ncId abierta → puedeResolver true para DT', async () => {
    const ncDoc = await ncRepo.create({ tipo: 'x', descripcion: 'A' });
    eventoRepo._items.push({
      id: 203, tipo: 'nc_reportada', texto: 'NC abierta', usuario: 'X',
      loteId: 1, loteNumero: 'FT-001', meta: { ncId: ncDoc.id }, createdAt: new Date().toISOString(),
    });
    const req = mockReq();
    const res = mockRes({ locals: { currentUser: { nombre: 'admin' } } });
    await sidebar.getBitacora(req, res);
    const args = res.render.mock.calls[0][1];
    const ev = args.eventos.find(e => e.texto === 'NC abierta');
    expect(ev.puedeResolver).toBe(true);
  });

  it('NC ya resuelta → puedeResolver false', async () => {
    const ncDoc = await ncRepo.create({ tipo: 'x', descripcion: 'A' });
    await ncRepo.resolver(ncDoc.id, 'DT');
    eventoRepo._items.push({
      id: 204, tipo: 'nc_reportada', texto: 'NC cerrada', usuario: 'X',
      loteId: 1, loteNumero: 'FT-001', meta: { ncId: ncDoc.id }, createdAt: new Date().toISOString(),
    });
    const req = mockReq();
    const res = mockRes({ locals: { currentUser: { nombre: 'admin' } } });
    await sidebar.getBitacora(req, res);
    const args = res.render.mock.calls[0][1];
    const ev = args.eventos.find(e => e.texto === 'NC cerrada');
    expect(ev.puedeResolver).toBe(false);
  });

  it('meta.paso fuera de [1,9] se ignora', async () => {
    eventoRepo._items.push({
      id: 205, tipo: 'paso_completado', texto: 'paso raro', usuario: 'X',
      loteId: 1, loteNumero: 'FT-001', meta: { paso: 99 }, createdAt: new Date().toISOString(),
    });
    const req = mockReq();
    const res = mockRes({ locals: { currentUser: { nombre: 'admin' } } });
    await sidebar.getBitacora(req, res);
    const args = res.render.mock.calls[0][1];
    const ev = args.eventos.find(e => e.texto === 'paso raro');
    expect(ev.paso).toBeNull();
  });

  it('operario → puedeResolver siempre false', async () => {
    const ncDoc = await ncRepo.create({ tipo: 'x', descripcion: 'A' });
    eventoRepo._items.push({
      id: 206, tipo: 'nc_reportada', texto: 'NC op', usuario: 'Sistema',
      loteId: 1, loteNumero: 'FT-001', meta: { ncId: ncDoc.id }, createdAt: new Date().toISOString(),
    });
    const req = mockReq();
    const res = mockRes({ locals: { currentUser: { nombre: 'Op', rol: 'operario' } } });
    await sidebar.getBitacora(req, res);
    const args = res.render.mock.calls[0][1];
    args.eventos.forEach(e => expect(e.puedeResolver).toBe(false));
  });
});

describe('AuthController showLogin - branches restantes', () => {
  let auth;
  beforeEach(() => {
    jest.resetModules();
    process.env.USE_MEMORY_REPOS = 'true';
    auth = require('../../src/controllers/AuthController');
  });

  it('sin req.flash usa defaults', () => {
    const req = mockReq();
    req.flash = jest.fn(() => []);
    const res = mockRes();
    auth.showLogin(req, res);
    expect(res.render).toHaveBeenCalled();
  });

  it('signup éxito ejecuta auto-login', async () => {
    const req = mockReq({
      body: {
        nombre: 'Demo Test', email: 'demo.test@farmatrack.co',
        password: 'pass1234', confirmPassword: 'pass1234',
        rol: 'operario', terminos: '1',
      },
    });
    const res = mockRes();
    await auth.signup(req, res);
    // Auto-login: debería terminar redirigiendo a /bienvenida
    expect(res.redirect).toHaveBeenCalledWith('/bienvenida');
  });
});
