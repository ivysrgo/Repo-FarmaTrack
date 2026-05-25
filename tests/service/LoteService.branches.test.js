/**
 * tests/service/LoteService.branches.test.js
 *
 * CAJA BLANCA — Cobertura de ramas no ejercidas por LoteService.test.js
 *
 * Tenemos acceso completo al código fuente. Cada describe apunta a una
 * rama (if/else/catch) específica dentro de LoteService.js y verifica
 * el comportamiento observable, NO los detalles internos.
 *
 * Ramas cubiertas aquí:
 *   [1]  crearOrden → error E11000 con campo 'numeroLote'
 *   [2]  crearOrden → error E11000 con otro campo (campo !== 'numeroLote')
 *   [3]  crearOrden → error genérico (no E11000) → mensaje genérico
 *   [4]  _emit      → eventoService.emit lanza → se silencia (no revienta)
 *   [5]  _emit      → sin eventoService → no hace nada
 *   [6]  avanzarOperario → datosDelPaso es un objeto plano
 *   [7]  avanzarOperario → estado NO es 'en_espera' → patch no cambia estado
 *   [8]  avanzarOperario → observaciones vacías en objeto → preserva las del lote
 *   [9]  liberar    → firmante vacío y directorTecnico vacío → 'Director Tecnico'
 *   [10] crearOrden → fecha fin presente en body
 *   [11] crearOrden → formulaId y formaFarmaceutica enviados explícitamente
 */
'use strict';

const { LoteService } = require('../../src/service/LoteService');

// ─── helpers ──────────────────────────────────────────────────────────────────

function buildRepo(seed = []) {
  const lotes = seed.map((l, i) => ({ id: i + 1, ...l }));
  let nextId = lotes.length + 1;
  return {
    _lotes: lotes,
    findAll:  jest.fn(async () => [...lotes]),
    findById: jest.fn(async id => lotes.find(l => l.id === parseInt(id, 10)) || null),
    create:   jest.fn(async data => {
      const nuevo = { id: nextId++, ...data };
      lotes.push(nuevo);
      return nuevo;
    }),
    update: jest.fn(async (id, patch) => {
      const lote = lotes.find(l => l.id === parseInt(id, 10));
      if (!lote) return null;
      Object.assign(lote, patch);
      return lote;
    }),
    stats: jest.fn(async () => ({ total: lotes.length })),
  };
}

function validBody(overrides = {}) {
  return {
    numeroOrden:    'OP-999',
    codigoLote:     'FT-999',
    producto:       'ProductoTest',
    cantidad:       '500',
    fechaInicio:    '2026-06-01',
    operario:       'OpTest',
    jefeCalidad:    'JCTest',
    area:           'Solidos',
    confirmFormula: '1',
    confirmMaterias:'1',
    confirmEquipos: '1',
    ...overrides,
  };
}

// ─── tests ────────────────────────────────────────────────────────────────────

describe('LoteService — ramas de crearOrden (manejo de errores del repo)', () => {

  // [1] E11000 en campo 'numeroLote'
  it('E11000 en numeroLote → mensaje específico con el código enviado', async () => {
    const repo = buildRepo();
    repo.create.mockRejectedValueOnce({ code: 11000, keyPattern: { numeroLote: 1 } });
    const svc = new LoteService(repo);

    const r = await svc.crearOrden(validBody({ codigoLote: 'FT-DUP' }), 'DT');

    expect(r.ok).toBe(false);
    expect(r.errores[0]).toMatch(/FT-DUP/);
    expect(r.errores[0]).toMatch(/ya existe/i);
  });

  // [2] E11000 en otro campo (ej. numeroOrden duplicado)
  it('E11000 en campo distinto de numeroLote → mensaje genérico con nombre del campo', async () => {
    const repo = buildRepo();
    repo.create.mockRejectedValueOnce({ code: 11000, keyPattern: { numeroOrden: 1 } });
    const svc = new LoteService(repo);

    const r = await svc.crearOrden(validBody(), 'DT');

    expect(r.ok).toBe(false);
    expect(r.errores[0]).toMatch(/numeroOrden/);
    expect(r.errores[0]).toMatch(/duplicados/i);
  });

  // [3] Error genérico (no E11000) → mensaje de fallback
  it('error genérico del repo → ok:false con mensaje genérico', async () => {
    const repo = buildRepo();
    repo.create.mockRejectedValueOnce(new Error('timeout'));
    const svc = new LoteService(repo);

    const r = await svc.crearOrden(validBody(), 'DT');

    expect(r.ok).toBe(false);
    expect(r.errores[0]).toMatch(/no se pudo crear/i);
  });

  // [10] Fecha fin presente → se guarda como ISO
  it('fechaFin enviada en body → se guarda correctamente en el lote', async () => {
    const repo = buildRepo();
    const svc = new LoteService(repo);

    const r = await svc.crearOrden(validBody({ fechaFin: '2026-06-15' }), 'DT');

    expect(r.ok).toBe(true);
    expect(r.lote.fechaFin).toBeTruthy();
    expect(r.lote.fechaFin).toMatch(/^2026-06-15/);
  });

  // [11] formulaId y formaFarmaceutica explícitos
  it('formulaId y formaFarmaceutica se guardan si vienen en body', async () => {
    const repo = buildRepo();
    const svc = new LoteService(repo);

    const r = await svc.crearOrden(
      validBody({ formulaId: 'AMX-500', formaFarmaceutica: 'Cápsulas', concentracion: '500mg' }),
      'DT'
    );

    expect(r.ok).toBe(true);
    expect(r.lote.formulaId).toBe('AMX-500');
    expect(r.lote.formaFarmaceutica).toBe('Cápsulas');
    expect(r.lote.concentracion).toBe('500mg');
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('LoteService — ramas de _emit', () => {

  // [4] eventoService.emit lanza → el error se silencia, crearOrden igual retorna ok:true
  it('si eventoService.emit lanza, crearOrden NO revienta', async () => {
    const repo = buildRepo();
    const eventoRoto = { emit: jest.fn().mockRejectedValue(new Error('kafka down')) };
    const svc = new LoteService(repo, eventoRoto);

    const r = await svc.crearOrden(validBody(), 'DT');

    // La orden se crea aunque el evento falle
    expect(r.ok).toBe(true);
    expect(r.lote.numeroLote).toBe('FT-999');
    expect(eventoRoto.emit).toHaveBeenCalled();
  });

  // [4b] emit lanza en liberar → también se silencia
  it('si eventoService.emit lanza durante liberar, liberar NO revienta', async () => {
    const repo = buildRepo([
      { numeroLote: 'FT-001', estado: 'en_produccion', pasoActual: 5,
        directorTecnico: 'DT', operario: 'Op' },
    ]);
    const eventoRoto = { emit: jest.fn().mockRejectedValue(new Error('red caída')) };
    const svc = new LoteService(repo, eventoRoto);

    const r = await svc.liberar(1, 'Firmante');

    expect(r.ok).toBe(true);
    expect(r.lote.estado).toBe('liberado');
  });

  // [5] Sin eventoService → _emit no hace nada (no hay propiedad, no revienta)
  it('sin eventoService, avanzarOperario funciona sin errores', async () => {
    const repo = buildRepo([
      { numeroLote: 'FT-X', estado: 'en_espera', pasoActual: 1, operario: 'Op', observaciones: '' },
    ]);
    const svc = new LoteService(repo); // sin eventoService

    const r = await svc.avanzarOperario(1, 1, 'obs prueba');

    expect(r.ok).toBe(true);
    expect(r.lote.pasoActual).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('LoteService — ramas de avanzarOperario', () => {

  // [6] datosDelPaso es un objeto plano con campos extras
  it('datosDelPaso como objeto → se fusionan todos los campos en el paso guardado', async () => {
    const repo = buildRepo([
      { numeroLote: 'FT-A', estado: 'en_produccion', pasoActual: 3,
        operario: 'Op', observaciones: '', pasos: {} },
    ]);
    const svc = new LoteService(repo);
    const datos = { observaciones: 'temp OK', temperatura: '22°C', humedad: '60%' };

    const r = await svc.avanzarOperario(1, 3, datos);

    expect(r.ok).toBe(true);
    // El paso se registra con los datos extras
    expect(r.lote.pasos[3]).toMatchObject({ temperatura: '22°C', humedad: '60%' });
  });

  // [7] Estado ya en_produccion → patch NO cambia el estado
  it('lote en_produccion → avanzar un paso NO cambia el estado', async () => {
    const repo = buildRepo([
      { numeroLote: 'FT-B', estado: 'en_produccion', pasoActual: 3, operario: 'Op', observaciones: '' },
    ]);
    const svc = new LoteService(repo);

    const r = await svc.avanzarOperario(1, 3, '');

    expect(r.lote.estado).toBe('en_produccion'); // no regresó a en_espera ni cambió
  });

  // [7b] Estado alerta_bpm → patch NO cambia el estado (rama if en_espera no aplica)
  it('lote alerta_bpm → avanzar NO lo pasa a en_produccion', async () => {
    const repo = buildRepo([
      { numeroLote: 'FT-C', estado: 'alerta_bpm', pasoActual: 2, operario: 'Op', observaciones: '' },
    ]);
    const svc = new LoteService(repo);

    const r = await svc.avanzarOperario(1, 2, '');

    expect(r.lote.estado).toBe('alerta_bpm');
  });

  // [8] datosDelPaso es objeto con observaciones vacías → preserva las del lote
  it('datosDelPaso objeto con observaciones en blanco → preserva observaciones previas del lote', async () => {
    const repo = buildRepo([
      { numeroLote: 'FT-D', estado: 'en_produccion', pasoActual: 4,
        operario: 'Op', observaciones: 'obs previas', pasos: {} },
    ]);
    const svc = new LoteService(repo);

    const r = await svc.avanzarOperario(1, 4, { observaciones: '   ', extra: 'x' });

    expect(r.lote.observaciones).toBe('obs previas');
  });

  // Paso 9 con datosDelPaso como objeto
  it('paso 9 con datosDelPaso objeto → notifica al DT correctamente', async () => {
    const repo = buildRepo([
      { numeroLote: 'FT-E', estado: 'en_produccion', pasoActual: 5,
        operario: 'Op', observaciones: '', pasos: {} },
    ]);
    const svc = new LoteService(repo);

    const r = await svc.avanzarOperario(1, 9, { observaciones: 'todo listo' });

    expect(r.ok).toBe(true);
    expect(r.accion).toBe('notificado');
    expect(r.lote.estado).toBe('pendiente_firma');
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('LoteService — ramas de liberar', () => {

  // [9] firmante vacío + directorTecnico vacío → default 'Director Tecnico'
  it('firmante null y directorTecnico vacío → liberadoPor = "Director Tecnico"', async () => {
    const repo = buildRepo([
      { numeroLote: 'FT-F', estado: 'en_produccion', pasoActual: 5,
        directorTecnico: '', operario: 'Op' },
    ]);
    const svc = new LoteService(repo);

    const r = await svc.liberar(1, null);

    expect(r.ok).toBe(true);
    expect(r.lote.liberadoPor).toBe('Director Tecnico');
  });

  // liberadoEn siempre es fecha ISO válida
  it('liberadoEn es una fecha ISO correcta', async () => {
    const repo = buildRepo([
      { numeroLote: 'FT-G', estado: 'en_produccion', pasoActual: 5,
        directorTecnico: 'DT', operario: 'Op' },
    ]);
    const svc = new LoteService(repo);

    const antes = new Date().toISOString();
    const r = await svc.liberar(1, 'DT Firmante');
    const despues = new Date().toISOString();

    expect(r.lote.liberadoEn >= antes).toBe(true);
    expect(r.lote.liberadoEn <= despues).toBe(true);
  });
});
