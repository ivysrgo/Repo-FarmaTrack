/**
 * tests/service/NoConformidadService.branches.test.js
 *
 * CAJA BLANCA — Ramas no ejercidas por NoConformidadService.test.js
 *
 * Ramas cubiertas:
 *   [1]  validar      → body null/undefined → no revienta, devuelve errores
 *   [2]  procesar     → body.loteId presente pero lote NO encontrado en repo
 *   [3]  procesar     → bloqueante='1' pero lote ya está 'liberado' → NO cambia estado
 *   [4]  procesar     → pasoLote inválido (texto / fuera de rango) → pasoValido = null
 *   [5]  procesar     → sin eventoService → no revienta
 *   [6]  resolver     → NC bloqueante pero lote NO está en 'alerta_bpm' → no restaura
 *   [7]  resolver     → NC NO bloqueante → loteRestaurado siempre null
 *   [8]  resolver     → sin loteId en la NC → no intenta buscar lote
 *   [9]  lotesActivos → filtra exactamente los 6 estados activos
 */
'use strict';

const { NoConformidadService } = require('../../src/service/NoConformidadService');

// ─── helpers ──────────────────────────────────────────────────────────────────

function buildLoteRepo(seed = []) {
  const lotes = seed.map((l, i) => ({ id: i + 1, ...l }));
  return {
    _lotes: lotes,
    findAll:  jest.fn(async () => [...lotes]),
    findById: jest.fn(async id => lotes.find(l => l.id === parseInt(id, 10)) || null),
    update:   jest.fn(async (id, patch) => {
      const l = lotes.find(x => x.id === parseInt(id, 10));
      if (!l) return null;
      Object.assign(l, patch);
      return l;
    }),
  };
}

function buildNcRepo(seed = []) {
  const items = seed.map((x, i) => ({ id: i + 1, resuelta: false, bloqueante: false, ...x }));
  let nextId = items.length + 1;
  return {
    _items: items,
    findAll:  jest.fn(async () => [...items]),
    findById: jest.fn(async id => items.find(x => x.id === parseInt(id, 10)) || null),
    create:   jest.fn(async data => {
      const nc = { id: nextId++, resuelta: false, ...data };
      items.push(nc);
      return nc;
    }),
    resolver: jest.fn(async (id, resueltaPor) => {
      const nc = items.find(x => x.id === parseInt(id, 10));
      if (!nc) return null;
      Object.assign(nc, { resuelta: true, resueltaPor, resueltaEn: new Date().toISOString() });
      return nc;
    }),
    stats: jest.fn(async () => ({ total: items.length, abiertas: 0, bloqueantes: 0 })),
  };
}

function buildSvc(lotes = [], ncs = [], eventoService = null) {
  return new NoConformidadService(buildLoteRepo(lotes), buildNcRepo(ncs), eventoService);
}

function bodyValido(overrides = {}) {
  return {
    tipo:        'proceso',
    descripcion: 'Descripción de la NC',
    impacto:     'alto',
    bloqueante:  '0',
    ...overrides,
  };
}

// ─── tests ────────────────────────────────────────────────────────────────────

describe('NoConformidadService — ramas de validar', () => {

  // [1] body null → no debe reventar
  it('validar(null) → no lanza, devuelve errores por los campos obligatorios', () => {
    const svc = buildSvc();
    expect(() => svc.validar(null)).not.toThrow();
    const errs = svc.validar(null);
    expect(errs.length).toBeGreaterThan(0);
  });

  it('validar(undefined) → igual que null', () => {
    const svc = buildSvc();
    expect(() => svc.validar(undefined)).not.toThrow();
  });

  it('validar con tipo pero descripción vacía → error en descripción', () => {
    const svc = buildSvc();
    const errs = svc.validar({ tipo: 'proceso', descripcion: '   ' });
    expect(errs.some(e => /descripcion/i.test(e))).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('NoConformidadService — ramas de procesar', () => {

  // [2] loteId presente pero lote no existe en el repo
  it('loteId enviado pero lote no encontrado → NC se crea igualmente sin loteNumero', async () => {
    const svc = buildSvc([]); // repo vacío
    const r = await svc.procesar(bodyValido({ loteId: '999', bloqueante: '1' }), 'Operario');

    expect(r.ok).toBe(true);
    expect(r.nc.loteNumero).toBe('');
    expect(r.lote).toBeNull(); // no se actualizó ningún lote
  });

  // [3] bloqueante='1' pero lote ya está 'liberado' → NO cambia estado del lote
  it('bloqueante=1 sobre lote liberado → el lote NO cambia a alerta_bpm', async () => {
    const loteRepo = buildLoteRepo([
      { numeroLote: 'FT-LIB', estado: 'liberado' },
    ]);
    const ncRepo = buildNcRepo();
    const svc = new NoConformidadService(loteRepo, ncRepo);

    const r = await svc.procesar(bodyValido({ loteId: '1', bloqueante: '1' }), 'Op');

    expect(r.ok).toBe(true);
    expect(loteRepo._lotes[0].estado).toBe('liberado'); // no cambió
    expect(r.lote).toBeNull();
  });

  // [4a] pasoLote con texto → pasoValido = null
  it('pasoLote="abc" → la NC se crea con pasoLote = null', async () => {
    const svc = buildSvc();
    const r = await svc.procesar(bodyValido({ pasoLote: 'abc' }), 'Op');

    expect(r.ok).toBe(true);
    expect(r.nc.pasoLote).toBeNull();
  });

  // [4b] pasoLote fuera de rango (0 o 10) → pasoValido = null
  it('pasoLote=0 → NC creada con pasoLote = null', async () => {
    const svc = buildSvc();
    const r = await svc.procesar(bodyValido({ pasoLote: '0' }), 'Op');
    expect(r.nc.pasoLote).toBeNull();
  });

  it('pasoLote=10 → NC creada con pasoLote = null', async () => {
    const svc = buildSvc();
    const r = await svc.procesar(bodyValido({ pasoLote: '10' }), 'Op');
    expect(r.nc.pasoLote).toBeNull();
  });

  // pasoLote válido (1-9) → se guarda correctamente
  it('pasoLote=5 → NC creada con pasoLote = 5', async () => {
    const svc = buildSvc();
    const r = await svc.procesar(bodyValido({ pasoLote: '5' }), 'Op');
    expect(r.nc.pasoLote).toBe(5);
  });

  // [5] Sin eventoService → procesar no lanza
  it('sin eventoService → procesar funciona sin errores', async () => {
    const svc = new NoConformidadService(buildLoteRepo(), buildNcRepo()); // sin eventoService
    const r = await svc.procesar(bodyValido(), 'Op');
    expect(r.ok).toBe(true);
  });

  // impacto ausente → usa 'medio' como default
  it('impacto no enviado → NC creada con impacto = "medio"', async () => {
    const svc = buildSvc();
    const body = { tipo: 'proceso', descripcion: 'Desc NC' }; // sin impacto
    const r = await svc.procesar(body, 'Op');
    expect(r.nc.impacto).toBe('medio');
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('NoConformidadService — ramas de resolver', () => {

  // [6] NC bloqueante pero lote ya NO está en alerta_bpm → loteRestaurado = null
  it('NC bloqueante con lote en en_produccion → resolver no lo cambia de estado', async () => {
    const loteRepo = buildLoteRepo([
      { numeroLote: 'FT-P', estado: 'en_produccion' },
    ]);
    const ncRepo = buildNcRepo([
      { tipo: 'proceso', descripcion: 'D', bloqueante: true, loteId: 1, loteNumero: 'FT-P', resuelta: false },
    ]);
    const svc = new NoConformidadService(loteRepo, ncRepo);

    const r = await svc.resolver(1, 'Director');

    expect(r.ok).toBe(true);
    expect(r.loteRestaurado).toBeNull();
    expect(loteRepo._lotes[0].estado).toBe('en_produccion'); // sin cambios
  });

  // [7] NC NO bloqueante → loteRestaurado siempre null aunque haya loteId
  it('NC no bloqueante → loteRestaurado = null sin importar el estado del lote', async () => {
    const loteRepo = buildLoteRepo([
      { numeroLote: 'FT-Q', estado: 'alerta_bpm' },
    ]);
    const ncRepo = buildNcRepo([
      { tipo: 'proceso', descripcion: 'D', bloqueante: false, loteId: 1, loteNumero: 'FT-Q', resuelta: false },
    ]);
    const svc = new NoConformidadService(loteRepo, ncRepo);

    const r = await svc.resolver(1, 'Dir');

    expect(r.ok).toBe(true);
    expect(r.loteRestaurado).toBeNull();
  });

  // [8] NC sin loteId → resolver no intenta buscar el lote
  it('NC sin loteId → resolver OK y no consulta el loteRepo', async () => {
    const loteRepo = buildLoteRepo();
    const ncRepo = buildNcRepo([
      { tipo: 'proceso', descripcion: 'D', bloqueante: true, loteId: null, resuelta: false },
    ]);
    const svc = new NoConformidadService(loteRepo, ncRepo);

    const r = await svc.resolver(1, 'Dir');

    expect(r.ok).toBe(true);
    expect(loteRepo.findById).not.toHaveBeenCalled();
    expect(r.loteRestaurado).toBeNull();
  });

  // NC ya resuelta → YA_RESUELTA
  it('resolver NC ya resuelta → ok:false, code YA_RESUELTA', async () => {
    const ncRepo = buildNcRepo([
      { tipo: 'proceso', descripcion: 'D', resuelta: true },
    ]);
    const svc = new NoConformidadService(buildLoteRepo(), ncRepo);

    const r = await svc.resolver(1, 'Dir');

    expect(r.ok).toBe(false);
    expect(r.code).toBe('YA_RESUELTA');
  });

  // NC no encontrada → NOT_FOUND
  it('resolver NC inexistente → ok:false, code NOT_FOUND', async () => {
    const svc = buildSvc();
    const r = await svc.resolver(999, 'Dir');
    expect(r.ok).toBe(false);
    expect(r.code).toBe('NOT_FOUND');
  });

  // [sin eventoService] resolver funciona sin lanzar
  it('sin eventoService → resolver funciona sin errores', async () => {
    const ncRepo = buildNcRepo([
      { tipo: 'proceso', descripcion: 'D', bloqueante: false, loteId: null, resuelta: false },
    ]);
    const svc = new NoConformidadService(buildLoteRepo(), ncRepo); // sin eventoService
    const r = await svc.resolver(1, 'Dir');
    expect(r.ok).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('NoConformidadService — lotesActivos filtra correctamente', () => {

  // [9] Verifica los 6 estados activos vs los inactivos (liberado, rechazado)
  const ACTIVOS = ['en_espera', 'en_produccion', 'pendiente_firma', 'en_calidad', 'alerta_bpm', 'bloqueado'];
  const INACTIVOS = ['liberado', 'rechazado'];

  it('incluye exactamente los 6 estados activos', async () => {
    const todos = [
      ...ACTIVOS.map((estado, i) => ({ numeroLote: `FT-A${i}`, estado })),
      ...INACTIVOS.map((estado, i) => ({ numeroLote: `FT-I${i}`, estado })),
    ];
    const svc = buildSvc(todos);

    const activos = await svc.lotesActivos();

    expect(activos).toHaveLength(6);
    ACTIVOS.forEach(estado => {
      expect(activos.some(l => l.estado === estado)).toBe(true);
    });
    INACTIVOS.forEach(estado => {
      expect(activos.some(l => l.estado === estado)).toBe(false);
    });
  });
});
