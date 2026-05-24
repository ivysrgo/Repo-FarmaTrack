/**
 * tests/controllers/BranchExtra2.test.js
 *
 * Ronda adicional de cobertura de branches: ejercitamos _tiempoRelativo
 * con timestamps de distintas edades, getNuevoLote, postNuevoLote con
 * errores, y _pasoAlertaPorLote con NCs.
 */
'use strict';

const { mockReq, mockRes } = require('../helpers/http');

let panel, lote, repo, eventoRepo, ncRepo;

beforeEach(() => {
  jest.resetModules();
  process.env.USE_MEMORY_REPOS = 'true';
  panel       = require('../../src/controllers/PanelController');
  lote        = require('../../src/controllers/LoteController');
  repo        = require('../../src/repositories/LoteRepository');
  eventoRepo  = require('../../src/repositories/EventoRepository');
  ncRepo      = require('../../src/repositories/NoConformidadRepository');
});

describe('PanelController - bitácora reciente con timestamps variados', () => {
  it('cubre las 4 ramas de _tiempoRelativo (momento/min/h/d)', async () => {
    const now = Date.now();
    // Insertamos 4 eventos con timestamps de distintas edades
    eventoRepo._items.push(
      { id: 100, tipo: 'lote_creado',    texto: 'a', usuario: 'X', loteId: null, loteNumero: '', meta: {}, createdAt: new Date(now - 10 * 1000).toISOString() },        // < 1 min
      { id: 101, tipo: 'paso_completado', texto: 'b', usuario: 'X', loteId: null, loteNumero: '', meta: {}, createdAt: new Date(now - 10 * 60 * 1000).toISOString() },  // 10 min
      { id: 102, tipo: 'lote_liberado',   texto: 'c', usuario: 'X', loteId: null, loteNumero: '', meta: {}, createdAt: new Date(now - 5 * 60 * 60 * 1000).toISOString() }, // 5h
      { id: 103, tipo: 'nc_reportada',    texto: 'd', usuario: 'X', loteId: null, loteNumero: '', meta: {}, createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString() }, // 3d
    );
    const req = mockReq();
    const res = mockRes({ locals: { currentUser: { nombre: 'admin' } } });
    await panel.getPanelDT(req, res);
    const args = res.render.mock.calls[0][1];
    const tiempos = args.bitacora.map(e => e.tiempo);
    expect(tiempos.some(t => /momento/i.test(t))).toBe(true);
    expect(tiempos.some(t => /min/.test(t))).toBe(true);
    expect(tiempos.some(t => /h/.test(t))).toBe(true);
    expect(tiempos.some(t => /d$/.test(t))).toBe(true);
  });

  it('cubre branches de buildPendientes: pendiente_firma, alerta_bpm, bloqueado', async () => {
    // El seed memoria ya tiene un pendiente_firma y un alerta_bpm. Agregamos bloqueado.
    await repo.update(3, { estado: 'bloqueado' });
    const req = mockReq();
    const res = mockRes({ locals: { currentUser: { nombre: 'admin' } } });
    await panel.getPanelDT(req, res);
    const args = res.render.mock.calls[0][1];
    const tipos = args.pendientes.map(p => p.label);
    expect(tipos).toEqual(expect.arrayContaining([
      expect.stringMatching(/Firma pendiente/i),
      expect.stringMatching(/Revisar desviacion/i),
      expect.stringMatching(/Lote bloqueado/i),
    ]));
  });

  it('cubre rama _pasoAlertaPorLote con NC bloqueante existente', async () => {
    // NC bloqueante asociada al lote 5
    await ncRepo.create({ tipo: 'desviacion_bpm', descripcion: 'BPM', bloqueante: true, loteId: 5, pasoLote: 3 });
    await repo.update(5, { estado: 'alerta_bpm' });
    const req = mockReq();
    const res = mockRes({ locals: { currentUser: { nombre: 'admin' } } });
    await panel.getPanelDT(req, res);
    const args = res.render.mock.calls[0][1];
    const lote5 = args.lotes.find(l => l.id === 5);
    expect(lote5.pasoAlerta).toBe(3);
  });

  it('flash messages presentes son pasados a la vista', async () => {
    const req = mockReq();
    req.flash = jest.fn((k) => k === 'ok' ? ['Bienvenido'] : ['Algo']);
    const res = mockRes({ locals: { currentUser: { nombre: 'admin' } } });
    await panel.getPanelDT(req, res);
    const args = res.render.mock.calls[0][1];
    expect(args.flashOk).toEqual(['Bienvenido']);
    expect(args.flashError).toEqual(['Algo']);
  });
});

describe('LoteController.getNuevoLote', () => {
  it('renderiza con operarios y catálogo de fórmulas', async () => {
    const req = mockReq();
    const res = mockRes({ locals: { currentUser: { nombre: 'DT', rol: 'director_tecnico' } } });
    await lote.getNuevoLote(req, res);
    expect(res.render).toHaveBeenCalledWith('lotes/nuevo', expect.objectContaining({
      currentPath: '/lotes',
      productosConFormula: expect.any(Array),
      formulasJson: expect.any(String),
      stockMapJson: expect.any(String),
      values: {},
    }));
  });

  it('jefesCalidadLista cae a default si no hay usuarios calidad', async () => {
    const req = mockReq();
    const res = mockRes();
    await lote.getNuevoLote(req, res);
    const args = res.render.mock.calls[0][1];
    expect(args.jefesCalidadLista).toEqual(expect.arrayContaining(['Patricia Henao']));
  });
});

describe('LoteController.postNuevoLote - errores de validación', () => {
  it('body vacío → re-renderiza con errores', async () => {
    const req = mockReq({ body: {} });
    const res = mockRes({ locals: { currentUser: { nombre: 'DT' } } });
    await lote.postNuevoLote(req, res);
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.render).toHaveBeenCalledWith('lotes/nuevo', expect.objectContaining({
      errores: expect.any(Array),
      values: expect.any(Object),
    }));
  });

  it('confirma flags booleanos en values al re-renderizar', async () => {
    const req = mockReq({ body: { confirmFormula: '1', confirmMaterias: '', confirmEquipos: '1' } });
    const res = mockRes({ locals: { currentUser: { nombre: 'DT' } } });
    await lote.postNuevoLote(req, res);
    const args = res.render.mock.calls[0][1];
    expect(args.values.confirmFormula).toBe(true);
    expect(args.values.confirmMaterias).toBe(false);
    expect(args.values.confirmEquipos).toBe(true);
  });
});
