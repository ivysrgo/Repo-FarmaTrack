/**
 * tests/controllers/BranchCoverage.test.js (async)
 *
 * Cubre ramas que los otros tests no ejercen.
 */
'use strict';

const { mockReq, mockRes, mockNext } = require('../helpers/http');

let lotes, operario, panel, sidebar, nc, auth, repo;

beforeEach(() => {
  jest.resetModules();
  process.env.USE_MEMORY_REPOS = 'true';
  lotes    = require('../../src/controllers/LoteController');
  operario = require('../../src/controllers/OperarioController');
  panel    = require('../../src/controllers/PanelController');
  sidebar  = require('../../src/controllers/SidebarController');
  nc       = require('../../src/controllers/NoConformidadController');
  auth     = require('../../src/controllers/AuthController');
  repo     = require('../../src/repositories/LoteRepository');
});

describe('LoteController.getPaso - los 9 pasos', () => {
  for (let n = 1; n <= 9; n++) {
    it('paso ' + n + ' renderiza lotes/paso' + n, async () => {
      await repo.update(1, { pasoActual: n });
      const req = mockReq({ params: { id: '1', n: String(n) } });
      const res = mockRes({ locals: { currentUser: { nombre: 'Juan' } } });
      await lotes.getPaso(req, res, mockNext());
      expect(res.render).toHaveBeenCalledWith('lotes/paso' + n, expect.objectContaining({ paso: n }));
    });
  }

  it('paso 1 incluye campos derivados', async () => {
    const req = mockReq({ params: { id: '1', n: '1' } });
    const res = mockRes({ locals: { currentUser: { nombre: 'Juan' } } });
    await lotes.getPaso(req, res, mockNext());
    const args = res.render.mock.calls[0][1];
    expect(args.ordenNumero).toBeDefined();
    expect(args.cantidad).toMatch(/unidades/);
  });

  it('paso 1 cae a defaults sin area ni director', async () => {
    const nuevo = await repo.create({ producto: 'X', cantidadPlanificada: 1000 });
    await repo.update(nuevo.id, { area: '', directorTecnico: '' });
    const req = mockReq({ params: { id: String(nuevo.id), n: '1' } });
    const res = mockRes();
    await lotes.getPaso(req, res, mockNext());
    const args = res.render.mock.calls[0][1];
    expect(args.area).toBeDefined();
    expect(args.director).toBeDefined();
  });
});

// Iteracion 3: accionDeLote solo tiene 2 variantes:
//   - alerta_bpm / bloqueado → "Revisar alerta"
//   - todo lo demas → "Continuar paso"
describe('OperarioController.accionDeLote - 2 variantes', () => {
  const casos = [
    { estado: 'en_produccion',   re: /Continuar/i },
    { estado: 'pendiente_firma', re: /Pendiente/i },
    { estado: 'en_espera',       re: /Continuar/i },
    { estado: 'alerta_bpm',      re: /alerta/i    },
    { estado: 'en_calidad',      re: /Continuar/i },
    { estado: 'bloqueado',       re: /alerta/i    },
  ];

  for (const c of casos) {
    it('estado=' + c.estado + ' genera accion correcta', async () => {
      await repo.update(1, { estado: c.estado, operario: 'Carlos R' });
      const req = mockReq();
      const res = mockRes({ locals: { currentUser: { nombre: 'Carlos R' } } });
      await operario.getDashboard(req, res);
      const args = res.render.mock.calls[0][1];
      const lote = args.activos.find(l => l.id === 1);
      expect(lote).toBeDefined();
      expect(lote.accion.label).toMatch(c.re);
    });
  }

  it('completadosHoy incluye liberados del operario', async () => {
    await repo.update(4, { operario: 'Op Lib' });
    const req = mockReq();
    const res = mockRes({ locals: { currentUser: { nombre: 'Op Lib' } } });
    await operario.getDashboard(req, res);
    const args = res.render.mock.calls[0][1];
    expect(args.completadosHoy.length).toBeGreaterThan(0);
  });

  it('singular en lotesAsignados con 1 completado', async () => {
    await repo.update(4, { operario: 'Solo' });
    const req = mockReq();
    const res = mockRes({ locals: { currentUser: { nombre: 'Solo' } } });
    await operario.getDashboard(req, res);
    expect(res.render.mock.calls[0][1].turno.lotesAsignados).toMatch(/completado/);
  });

  it('pendienteDT seteado si hay pendiente_firma del operario', async () => {
    await repo.update(2, { operario: 'Op PF' });
    const req = mockReq();
    const res = mockRes({ locals: { currentUser: { nombre: 'Op PF' } } });
    await operario.getDashboard(req, res);
    const args = res.render.mock.calls[0][1];
    expect(args.pendienteDT).toBeDefined();
    expect(args.pendienteDT.estado).toBe('pendiente_firma');
  });

  it('pendienteDT null si no hay ninguno pendiente', async () => {
    await repo.update(1, { estado: 'en_produccion', operario: 'Sin PF' });
    const req = mockReq();
    const res = mockRes({ locals: { currentUser: { nombre: 'Sin PF' } } });
    await operario.getDashboard(req, res);
    expect(res.render.mock.calls[0][1].pendienteDT).toBeNull();
  });

  it('fallback Operario sin nombre', async () => {
    const req = mockReq();
    const res = mockRes({ locals: { currentUser: {} } });
    await operario.getDashboard(req, res);
    expect(res.render.mock.calls[0][1].usuario.nombre).toBe('Operario');
  });

  it('inicial O cuando no hay nombre (cae a Operario)', async () => {
    const req = mockReq();
    const res = mockRes();
    await operario.getDashboard(req, res);
    const args = res.render.mock.calls[0][1];
    expect(args.usuario.iniciales).toBe('O');
    expect(args.usuario.nombre).toBe('Operario');
  });
});

describe('PanelController - ramas adicionales', () => {
  it('lee flash messages cuando hay', async () => {
    const req = mockReq();
    req.flash.mockImplementation(k => k === 'ok' ? ['Lote creado'] : []);
    const res = mockRes({ locals: { currentUser: { nombre: 'Juan' } } });
    await panel.getPanelDT(req, res);
    expect(res.render.mock.calls[0][1].flashOk).toEqual(['Lote creado']);
  });

  it('si req.flash es undefined, flash arrays son []', async () => {
    const req = mockReq();
    delete req.flash;
    const res = mockRes({ locals: { currentUser: { nombre: 'Juan' } } });
    await panel.getPanelDT(req, res);
    const args = res.render.mock.calls[0][1];
    expect(args.flashOk).toEqual([]);
    expect(args.flashError).toEqual([]);
  });

  it('fallback DT sin nombre en currentUser', async () => {
    const req = mockReq();
    const res = mockRes({ locals: { currentUser: {} } });
    await panel.getPanelDT(req, res);
    expect(res.render.mock.calls[0][1].usuario.iniciales).toBe('DT');
  });
});

describe('SidebarController - fallbacks', () => {
  it('getBitacora con operario sin nombre no filtra y renderiza eventos (array, puede estar vacio)', async () => {
    const req = mockReq();
    const res = mockRes({ locals: { currentUser: { rol: 'operario' } } });
    await sidebar.getBitacora(req, res);
    expect(Array.isArray(res.render.mock.calls[0][1].eventos)).toBe(true);
  });

  it('flash poblados pasan a la vista', async () => {
    const req = mockReq();
    req.flash.mockImplementation(k => k === 'ok' ? ['msg'] : []);
    const res = mockRes({ locals: { currentUser: { nombre: 'Juan' } } });
    await sidebar.getBatchRecords(req, res);
    expect(res.render.mock.calls[0][1].flashOk).toEqual(['msg']);
  });

  it('sin req.flash, flash arrays son []', async () => {
    const req = mockReq();
    delete req.flash;
    const res = mockRes({ locals: { currentUser: { nombre: 'Juan' } } });
    await sidebar.getBatchRecords(req, res);
    expect(res.render.mock.calls[0][1].flashOk).toEqual([]);
  });

  it('getConfiguracion: rol vacio cae a Usuario', () => {
    const req = mockReq();
    const res = mockRes({ locals: { currentUser: { nombre: 'X', rol: '' } } });
    sidebar.getConfiguracion(req, res);
    expect(res.render.mock.calls[0][1].perfil.rolLabel).toBe('Usuario');
  });

  it('getConfiguracion: rol calidad', () => {
    const req = mockReq();
    const res = mockRes({ locals: { currentUser: { nombre: 'X', rol: 'calidad' } } });
    sidebar.getConfiguracion(req, res);
    expect(res.render.mock.calls[0][1].perfil.rolLabel).toBe('Analista de Calidad');
  });
});

describe('NoConformidadController - ramas defaults', () => {
  it('postNueva sin currentUser cae a /panel', async () => {
    const req = mockReq({ body: { tipo: 'desv', descripcion: 'algo' } });
    const res = mockRes();
    await nc.postNueva(req, res);
    expect(res.redirect).toHaveBeenCalledWith('/panel');
  });

  it('loteId sin bloqueante NO toca el lote', async () => {
    const antes = (await repo.findById(1)).estado;
    const req = mockReq({ body: { tipo: 'doc', descripcion: 'sin', loteId: '1' } });
    const res = mockRes({ locals: { currentUser: { rol: 'director_tecnico' } } });
    await nc.postNueva(req, res);
    expect((await repo.findById(1)).estado).toBe(antes);
  });
});

describe('AuthController.showLogin - ramas session', () => {
  it('session sin usuario -> renderiza form', () => {
    const req = mockReq({ session: {} });
    const res = mockRes();
    auth.showLogin(req, res);
    expect(res.render).toHaveBeenCalled();
  });

  it('session undefined no crashea', () => {
    const req = mockReq();
    delete req.session;
    const res = mockRes();
    expect(() => auth.showLogin(req, res)).not.toThrow();
    expect(res.render).toHaveBeenCalled();
  });
});

describe('LoteRepository - ramas defaults', () => {
  it('create sin operario -> iniciales ""', async () => {
    const nuevo = await repo.create({ producto: 'X', cantidadPlanificada: 100 });
    expect(nuevo.operarioIniciales).toBe('');
  });

  it('create con medicamento como alias', async () => {
    const nuevo = await repo.create({ medicamento: 'Aspirina', cantidadPlanificada: 100 });
    expect(nuevo.producto).toBe('Aspirina');
    expect(nuevo.medicamento).toBe('Aspirina');
  });

  it('create con fechaFin ISO', async () => {
    const nuevo = await repo.create({ producto: 'X', cantidadPlanificada: 100, fechaFin: '2026-12-31T00:00:00.000Z' });
    expect(nuevo.fechaFin).toBe('2026-12-31T00:00:00.000Z');
  });

  it('create sin cantidadPlanificada -> 0', async () => {
    const nuevo = await repo.create({ producto: 'X' });
    expect(nuevo.cantidadPlanificada).toBe(0);
  });

  it('create con pasoActual string -> int', async () => {
    const nuevo = await repo.create({ producto: 'X', cantidadPlanificada: 100, pasoActual: '5' });
    expect(nuevo.pasoActual).toBe(5);
  });

  it('findAll sin filtros y {} dan iguales', async () => {
    expect((await repo.findAll()).length).toBe(5);
    expect((await repo.findAll({})).length).toBe(5);
  });

});
