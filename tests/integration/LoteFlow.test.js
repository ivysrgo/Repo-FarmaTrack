/**
 * tests/integration/LoteFlow.test.js
 *
 * CAJA GRIS — Integración: LoteService ↔ LoteRepository (en memoria)
 *
 * Conocemos la arquitectura y el contrato del repo (interfaz async, store
 * en memoria, campos que persiste), pero NO probamos detalles internos
 * del service. Verificamos el ESTADO REAL del store después de cada
 * operación, no solo el valor de retorno.
 *
 * Lo que se prueba aquí (y no en los unit tests):
 *   [1]  Crear un lote → findById sobre el repo real devuelve el lote completo
 *   [2]  Campos del lote recién creado son correctos en el store
 *   [3]  avanzarOperario 1→2→3 → pasoActual en el repo avanza secuencialmente
 *   [4]  avanzarOperario desde en_espera → el store refleja en_produccion
 *   [5]  Paso 9 → el store refleja pendiente_firma
 *   [6]  liberar → el store refleja estado=liberado, pasoActual=9, fechas ISO
 *   [7]  stats() → contadores coherentes con el contenido real del store
 *   [8]  findAll con filtro de estado → solo devuelve los del estado pedido
 *   [9]  Dos lotes con distintos datos → no se mezclan (aislamiento)
 *   [10] update directo del repo → estadoLabel se actualiza también
 */
'use strict';

const { LoteService }    = require('../../src/service/LoteService');
const { LoteRepository } = require('../../src/repositories/LoteRepository');

// ─── helpers ──────────────────────────────────────────────────────────────────

function freshRepo() {
  // Repo limpio, sin seed demo, para controlar exactamente qué hay dentro
  const repo = new LoteRepository();
  repo._lotes  = [];
  repo._nextId = 1;
  return repo;
}

function freshSvc(repo) {
  return new LoteService(repo);
}

function ordenValida(overrides = {}) {
  return {
    numeroOrden:    'OP-IT-001',
    codigoLote:     'FT-IT-001',
    producto:       'Amoxicilina 500 mg',
    cantidad:       '1000',
    fechaInicio:    '2026-06-01',
    operario:       'Carlos Rodriguez',
    jefeCalidad:    'Patricia Henao',
    area:           'Solidos - Linea 1',
    confirmFormula: '1',
    confirmMaterias:'1',
    confirmEquipos: '1',
    directorTecnico:'David Pena',
    ...overrides,
  };
}

// ─── tests ────────────────────────────────────────────────────────────────────

describe('LoteFlow (Caja Gris) — crearOrden persiste en el repo real', () => {
  let repo, svc;

  beforeEach(() => { repo = freshRepo(); svc = freshSvc(repo); });

  // [1] El lote queda accesible por findById después de crearlo
  it('después de crearOrden → findById devuelve el mismo lote', async () => {
    const r = await svc.crearOrden(ordenValida(), 'DT Test');

    expect(r.ok).toBe(true);
    const enRepo = await repo.findById(r.lote.id);
    expect(enRepo).not.toBeNull();
    expect(enRepo.id).toBe(r.lote.id);
  });

  // [2] Campos correctos en el store
  it('los campos del lote en el store son los correctos', async () => {
    const r = await svc.crearOrden(ordenValida(), 'DT Test');
    const enRepo = await repo.findById(r.lote.id);

    expect(enRepo.numeroLote).toBe('FT-IT-001');
    expect(enRepo.producto).toBe('Amoxicilina 500 mg');
    expect(enRepo.cantidadPlanificada).toBe(1000);
    expect(enRepo.estado).toBe('en_espera');
    expect(enRepo.pasoActual).toBe(1);
    expect(enRepo.operario).toBe('Carlos Rodriguez');
    expect(enRepo.directorTecnico).toBe('David Pena');
  });

  // Estado inicial siempre es en_espera
  it('lote recién creado → estado en el store es en_espera', async () => {
    const r = await svc.crearOrden(ordenValida(), 'DT');
    expect((await repo.findById(r.lote.id)).estado).toBe('en_espera');
  });

  // estadoLabel se genera automáticamente en el repo
  it('estadoLabel en el store = "En espera" para lote nuevo', async () => {
    const r = await svc.crearOrden(ordenValida(), 'DT');
    const enRepo = await repo.findById(r.lote.id);
    expect(enRepo.estadoLabel).toBe('En espera');
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('LoteFlow (Caja Gris) — avanzarOperario persiste pasos en el repo', () => {
  let repo, svc, loteId;

  beforeEach(async () => {
    repo = freshRepo();
    svc  = freshSvc(repo);
    const r = await svc.crearOrden(ordenValida(), 'DT');
    loteId = r.lote.id;
  });

  // [3] Paso 1 → el repo muestra pasoActual = 2
  it('avanzar paso 1 → pasoActual en el repo es 2', async () => {
    await svc.avanzarOperario(loteId, 1, 'Verificado');
    const enRepo = await repo.findById(loteId);
    expect(enRepo.pasoActual).toBe(2);
  });

  // [3] Secuencia 1→2→3 → el repo avanza correctamente
  it('secuencia pasos 1→2→3 → pasoActual en el repo es 4', async () => {
    await svc.avanzarOperario(loteId, 1, 'paso 1 ok');
    await svc.avanzarOperario(loteId, 2, 'paso 2 ok');
    await svc.avanzarOperario(loteId, 3, 'paso 3 ok');

    const enRepo = await repo.findById(loteId);
    expect(enRepo.pasoActual).toBe(4);
  });

  // [4] Primer paso → estado cambia a en_produccion en el repo
  it('primer avance desde en_espera → estado en repo es en_produccion', async () => {
    await svc.avanzarOperario(loteId, 1, '');
    const enRepo = await repo.findById(loteId);
    expect(enRepo.estado).toBe('en_produccion');
  });

  // Los pasos se guardan en enRepo.pasos con fechaRegistro
  it('los datos de cada paso se guardan en enRepo.pasos[n]', async () => {
    await svc.avanzarOperario(loteId, 1, { observaciones: 'temp 22°C', resultado: 'ok' });
    const enRepo = await repo.findById(loteId);

    expect(enRepo.pasos[1]).toBeDefined();
    expect(enRepo.pasos[1].observaciones).toBe('temp 22°C');
    expect(enRepo.pasos[1].fechaRegistro).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  // [5] Paso 9 → estado en repo es pendiente_firma
  it('paso 9 → estado en repo es pendiente_firma', async () => {
    // Primero avanzamos a en_produccion para que no quede en en_espera
    await svc.avanzarOperario(loteId, 1, '');
    await svc.avanzarOperario(loteId, 9, 'listo para firma');

    const enRepo = await repo.findById(loteId);
    expect(enRepo.estado).toBe('pendiente_firma');
    expect(enRepo.pasoActual).toBe(9);
  });

  // pasoActual nunca decrece en el repo
  it('avanzar un paso anterior al actual → pasoActual en repo NO decrece', async () => {
    // Llevamos el lote a paso 5 directamente actualizando el repo
    await repo.update(loteId, { pasoActual: 5, estado: 'en_produccion' });

    await svc.avanzarOperario(loteId, 2, ''); // paso anterior

    const enRepo = await repo.findById(loteId);
    expect(enRepo.pasoActual).toBe(5); // no retrocedió
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('LoteFlow (Caja Gris) — liberar persiste correctamente en el repo', () => {
  let repo, svc, loteId;

  beforeEach(async () => {
    repo = freshRepo();
    svc  = freshSvc(repo);
    const r = await svc.crearOrden(ordenValida(), 'DT');
    loteId = r.lote.id;
    // Simular que el operario completó todos los pasos
    await repo.update(loteId, { estado: 'pendiente_firma', pasoActual: 9 });
  });

  // [6] Liberar → el store refleja todos los campos correctos
  it('liberar → estado en repo = liberado', async () => {
    await svc.liberar(loteId, 'Juan DT');
    const enRepo = await repo.findById(loteId);
    expect(enRepo.estado).toBe('liberado');
  });

  it('liberar → pasoActual en repo = 9', async () => {
    await svc.liberar(loteId, 'Juan DT');
    const enRepo = await repo.findById(loteId);
    expect(enRepo.pasoActual).toBe(9);
  });

  it('liberar → liberadoPor en repo es el firmante', async () => {
    await svc.liberar(loteId, 'Juan DT');
    const enRepo = await repo.findById(loteId);
    expect(enRepo.liberadoPor).toBe('Juan DT');
  });

  it('liberar → liberadoEn en repo es una fecha ISO válida y reciente', async () => {
    const antes = new Date().toISOString();
    await svc.liberar(loteId, 'Juan DT');
    const despues = new Date().toISOString();
    const enRepo = await repo.findById(loteId);

    expect(enRepo.liberadoEn).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(enRepo.liberadoEn >= antes).toBe(true);
    expect(enRepo.liberadoEn <= despues).toBe(true);
  });

  it('liberar → estadoLabel en repo = "Liberado"', async () => {
    await svc.liberar(loteId, 'Juan DT');
    const enRepo = await repo.findById(loteId);
    expect(enRepo.estadoLabel).toBe('Liberado');
  });

  // Liberar dos veces → YA_LIBERADO, el repo no cambia
  it('liberar un lote ya liberado → ok:false y repo no cambia', async () => {
    await svc.liberar(loteId, 'Juan DT');
    const r2 = await svc.liberar(loteId, 'Otro DT');

    expect(r2.ok).toBe(false);
    expect(r2.code).toBe('YA_LIBERADO');
    // liberadoPor sigue siendo el primer firmante
    const enRepo = await repo.findById(loteId);
    expect(enRepo.liberadoPor).toBe('Juan DT');
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('LoteFlow (Caja Gris) — stats y findAll reflejan el estado real del repo', () => {
  let repo, svc;

  beforeEach(() => { repo = freshRepo(); svc = freshSvc(repo); });

  // [7] stats() coherentes con el contenido del store
  it('stats.total crece con cada lote creado', async () => {
    const s0 = await svc.stats();
    await svc.crearOrden(ordenValida({ codigoLote: 'FT-S1' }), 'DT');
    const s1 = await svc.stats();
    await svc.crearOrden(ordenValida({ codigoLote: 'FT-S2', numeroOrden: 'OP-S2' }), 'DT');
    const s2 = await svc.stats();

    expect(s1.total).toBe(s0.total + 1);
    expect(s2.total).toBe(s0.total + 2);
  });

  // [8] findAll con filtro de estado
  it('findAll({ estado: "en_espera" }) → solo devuelve lotes en ese estado', async () => {
    await svc.crearOrden(ordenValida({ codigoLote: 'FT-E1' }), 'DT');
    await svc.crearOrden(ordenValida({ codigoLote: 'FT-E2', numeroOrden: 'OP-E2' }), 'DT');

    // Mover uno a en_produccion para que haya variedad
    const todos = await repo.findAll();
    const ultimo = todos[todos.length - 1];
    await repo.update(ultimo.id, { estado: 'en_produccion' });

    const enEspera = await svc.findAll({ estado: 'en_espera' });
    enEspera.forEach(l => expect(l.estado).toBe('en_espera'));
  });

  // [9] Dos lotes con distintos datos no se mezclan
  it('dos lotes creados → findById devuelve exactamente su propio dato', async () => {
    const r1 = await svc.crearOrden(
      ordenValida({ codigoLote: 'FT-X1', producto: 'Producto X' }), 'DT'
    );
    const r2 = await svc.crearOrden(
      ordenValida({ codigoLote: 'FT-X2', producto: 'Producto Y', numeroOrden: 'OP-X2' }), 'DT'
    );

    const l1 = await repo.findById(r1.lote.id);
    const l2 = await repo.findById(r2.lote.id);

    expect(l1.producto).toBe('Producto X');
    expect(l2.producto).toBe('Producto Y');
    expect(l1.id).not.toBe(l2.id);
  });

  // [10] update directo del repo → estadoLabel se actualiza
  it('update directo del repo con nuevo estado → estadoLabel se sincroniza', async () => {
    const r = await svc.crearOrden(ordenValida(), 'DT');
    await repo.update(r.lote.id, { estado: 'alerta_bpm' });

    const enRepo = await repo.findById(r.lote.id);
    expect(enRepo.estadoLabel).toBe('Alerta BPM');
  });
});
