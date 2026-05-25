/**
 * tests/integration/NCAndAuthFlow.test.js
 *
 * CAJA GRIS — Integración con repos reales en memoria:
 *   Bloque A: NoConformidadService ↔ LoteRepository + NoConformidadRepository
 *   Bloque B: AuthService          ↔ UsuarioRepository
 *
 * Conocemos la arquitectura (dos repos intercambiables, store en memoria),
 * pero los tests verifican el estado persistido en el store, no los
 * internos del service.
 *
 * Bloque A cubre:
 *   [1]  procesar NC bloqueante → lote queda alerta_bpm en el repo
 *   [2]  procesar NC no bloqueante → lote NO cambia estado en el repo
 *   [3]  resolver NC bloqueante → lote vuelve a en_produccion en el repo
 *   [4]  resolver NC no bloqueante → lote NO cambia de estado
 *   [5]  listar() después de procesar → la NC aparece en el listado
 *   [6]  stats() refleja contadores reales del store de NCs
 *   [7]  múltiples NCs en el mismo lote → todas se guardan correctamente
 *   [8]  lotesActivos() solo devuelve estados activos del repo de lotes
 *
 * Bloque B cubre:
 *   [9]  login exitoso → touchLastLogin actualiza ultimaSesion en el store
 *   [10] login exitoso → ultimaSesion en sesión es la fecha ANTERIOR (no la nueva)
 *   [11] primer login (sin ultimaSesion previa) → ultimaSesion = null en sesión
 *   [12] login fallido → findByEmail fue llamado, pero el store NO se modifica
 *   [13] findAll del repo devuelve todos los usuarios del store
 */
'use strict';

const { NoConformidadService }   = require('../../src/service/NoConformidadService');
const { LoteRepository }          = require('../../src/repositories/LoteRepository');
const { NoConformidadRepository } = require('../../src/repositories/NoConformidadRepository');
const { AuthService }             = require('../../src/service/AuthService');
const { UsuarioRepository }       = require('../../src/repositories/UsuarioRepository');

// ─── helpers ──────────────────────────────────────────────────────────────────

function freshLoteRepo() {
  const r = new LoteRepository();
  r._lotes = []; r._nextId = 1;
  return r;
}

function freshNcRepo() {
  return new NoConformidadRepository();
}

function freshNCService(loteRepo, ncRepo, eventoService = null) {
  return new NoConformidadService(loteRepo, ncRepo, eventoService);
}

function bodyNC(overrides = {}) {
  return {
    tipo:        'proceso',
    descripcion: 'Temperatura fuera de rango',
    impacto:     'alto',
    bloqueante:  '1',
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// BLOQUE A — NoConformidadService + repos reales
// ═══════════════════════════════════════════════════════════════════════════

describe('NCFlow (Caja Gris) — procesar NC persiste en repos reales', () => {
  let loteRepo, ncRepo, svc, loteId;

  beforeEach(async () => {
    loteRepo = freshLoteRepo();
    ncRepo   = freshNcRepo();
    svc      = freshNCService(loteRepo, ncRepo);

    // Crear un lote en_produccion directamente en el repo
    const lote = await loteRepo.create({
      numeroLote: 'FT-NC-001', producto: 'Ibuprofeno', estado: 'en_produccion',
      pasoActual: 3, operario: 'Op NC',
    });
    loteId = lote.id;
  });

  // [1] NC bloqueante → lote queda alerta_bpm en el repo
  it('NC bloqueante → estado del lote en repo cambia a alerta_bpm', async () => {
    await svc.procesar(bodyNC({ loteId: String(loteId), bloqueante: '1' }), 'DT');

    const enRepo = await loteRepo.findById(loteId);
    expect(enRepo.estado).toBe('alerta_bpm');
  });

  // [2] NC no bloqueante → lote NO cambia estado
  it('NC no bloqueante → estado del lote en repo NO cambia', async () => {
    await svc.procesar(bodyNC({ loteId: String(loteId), bloqueante: '0' }), 'DT');

    const enRepo = await loteRepo.findById(loteId);
    expect(enRepo.estado).toBe('en_produccion');
  });

  // [5] listar() después de procesar → la NC aparece
  it('después de procesar → listar() incluye la NC creada', async () => {
    await svc.procesar(bodyNC({ loteId: String(loteId) }), 'Operario');

    const lista = await svc.listar();
    expect(lista.length).toBeGreaterThanOrEqual(1);
    expect(lista[0].tipo).toBe('proceso');
    expect(lista[0].descripcion).toContain('Temperatura');
  });

  // La NC guarda el loteNumero correcto
  it('NC creada guarda el numero de lote del repo', async () => {
    const r = await svc.procesar(bodyNC({ loteId: String(loteId) }), 'Operario');

    expect(r.nc.loteNumero).toBe('FT-NC-001');
  });

  // La NC guarda el reportadoPor correcto
  it('NC creada guarda el reportadoPor pasado al procesar', async () => {
    const r = await svc.procesar(bodyNC({ loteId: String(loteId) }), 'Carlos Jefe');

    expect(r.nc.reportadoPor).toBe('Carlos Jefe');
  });

  // NC recién creada tiene resuelta = false en el repo
  it('NC creada en el repo tiene resuelta = false', async () => {
    const r = await svc.procesar(bodyNC(), 'Op');

    const enRepo = await ncRepo.findById(r.nc.id);
    expect(enRepo.resuelta).toBe(false);
  });

  // [7] Múltiples NCs en el mismo lote
  it('dos NCs en el mismo lote → ambas se guardan correctamente', async () => {
    await svc.procesar(bodyNC({ loteId: String(loteId), descripcion: 'NC primera' }), 'Op');
    await svc.procesar(bodyNC({ loteId: String(loteId), descripcion: 'NC segunda', bloqueante: '0' }), 'Op');

    const lista = await svc.listar();
    const delLote = lista.filter(nc => String(nc.loteId) === String(loteId));
    expect(delLote).toHaveLength(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('NCFlow (Caja Gris) — resolver NC actualiza repos reales', () => {
  let loteRepo, ncRepo, svc, loteId, ncId;

  beforeEach(async () => {
    loteRepo = freshLoteRepo();
    ncRepo   = freshNcRepo();
    svc      = freshNCService(loteRepo, ncRepo);

    const lote = await loteRepo.create({
      numeroLote: 'FT-NC-R01', producto: 'Metformina', estado: 'alerta_bpm',
      pasoActual: 4, operario: 'Op R',
    });
    loteId = lote.id;

    const r = await svc.procesar(
      bodyNC({ loteId: String(loteId), bloqueante: '1' }),
      'Inspector'
    );
    ncId = r.nc.id;

    // Aseguramos que el lote quedó en alerta_bpm para la prueba de resolver
    await loteRepo.update(loteId, { estado: 'alerta_bpm' });
  });

  // [3] Resolver NC bloqueante → lote vuelve a en_produccion en el repo
  it('resolver NC bloqueante → lote vuelve a en_produccion en el repo', async () => {
    await svc.resolver(ncId, 'Director Calidad');

    const enRepo = await loteRepo.findById(loteId);
    expect(enRepo.estado).toBe('en_produccion');
  });

  // NC resuelta queda marcada en el repo
  it('resolver → NC queda con resuelta = true en el repo', async () => {
    await svc.resolver(ncId, 'Director Calidad');

    const ncEnRepo = await ncRepo.findById(ncId);
    expect(ncEnRepo.resuelta).toBe(true);
    expect(ncEnRepo.resueltaPor).toBe('Director Calidad');
    expect(ncEnRepo.resueltaEn).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  // [4] NC no bloqueante resuelta → lote no cambia
  it('resolver NC no bloqueante → estado del lote no cambia en repo', async () => {
    // Crear NC no bloqueante
    const lote2 = await loteRepo.create({
      numeroLote: 'FT-NC-R02', estado: 'en_produccion', producto: 'X',
    });
    const r2 = await svc.procesar(
      bodyNC({ loteId: String(lote2.id), bloqueante: '0' }), 'Op'
    );

    await svc.resolver(r2.nc.id, 'Director');

    const enRepo = await loteRepo.findById(lote2.id);
    expect(enRepo.estado).toBe('en_produccion');
  });

  // [6] stats() refleja contadores reales
  it('stats() → abiertas decrece después de resolver', async () => {
    const antes = await svc.stats();
    await svc.resolver(ncId, 'Dir');
    const despues = await svc.stats();

    expect(despues.abiertas).toBe(antes.abiertas - 1);
  });

  it('stats() → bloqueantes decrece al resolver NC bloqueante', async () => {
    const antes = await svc.stats();
    await svc.resolver(ncId, 'Dir');
    const despues = await svc.stats();

    expect(despues.bloqueantes).toBe(antes.bloqueantes - 1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('NCFlow (Caja Gris) — lotesActivos usa el repo real', () => {

  // [8] lotesActivos() solo devuelve estados activos del repo de lotes
  it('lotesActivos() excluye liberados y rechazados del repo real', async () => {
    const loteRepo = freshLoteRepo();
    const svc = freshNCService(loteRepo, freshNcRepo());

    await loteRepo.create({ numeroLote: 'FT-ACT-1', estado: 'en_produccion', producto: 'P' });
    await loteRepo.create({ numeroLote: 'FT-ACT-2', estado: 'liberado', producto: 'P' });
    await loteRepo.create({ numeroLote: 'FT-ACT-3', estado: 'rechazado', producto: 'P' });
    await loteRepo.create({ numeroLote: 'FT-ACT-4', estado: 'alerta_bpm', producto: 'P' });

    const activos = await svc.lotesActivos();

    expect(activos.some(l => l.numeroLote === 'FT-ACT-1')).toBe(true);
    expect(activos.some(l => l.numeroLote === 'FT-ACT-4')).toBe(true);
    expect(activos.some(l => l.numeroLote === 'FT-ACT-2')).toBe(false); // liberado
    expect(activos.some(l => l.numeroLote === 'FT-ACT-3')).toBe(false); // rechazado
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// BLOQUE B — AuthService + UsuarioRepository real
// ═══════════════════════════════════════════════════════════════════════════

describe('AuthFlow (Caja Gris) — AuthService con UsuarioRepository real', () => {
  let store, repo, auth;

  beforeEach(() => {
    // Store propio para cada test, sin afectar el singleton de config/database.js
    store = {
      usuarios: [
        {
          id: 'u-t01', nombre: 'Ana Tester', email: 'ana.tester@farmatrack.co',
          password: 'segura123', rol: 'director_tecnico', cargo: 'DT', activo: true,
          ultimaSesion: null,
        },
        {
          id: 'u-t02', nombre: 'Luis Tester', email: 'luis.tester@farmatrack.co',
          password: 'clave456', rol: 'operario', cargo: 'OP', activo: true,
          ultimaSesion: null,
        },
        {
          id: 'u-t03', nombre: 'Inactivo', email: 'inactivo@farmatrack.co',
          password: '1234', rol: 'operario', cargo: 'OP', activo: false,
        },
      ],
    };
    repo = new UsuarioRepository(store);
    auth = new AuthService(repo);
  });

  // [9] Login exitoso → touchLastLogin actualiza ultimaSesion en el store
  it('login exitoso → ultimaSesion del usuario en el store se actualiza', async () => {
    await auth.login('ana.tester@farmatrack.co', 'segura123');

    const enStore = store.usuarios.find(u => u.id === 'u-t01');
    expect(enStore.ultimaSesion).not.toBeNull();
    expect(enStore.ultimaSesion).toBeInstanceOf(Date);
  });

  // [10] ultimaSesion en sesión es la fecha ANTERIOR, no la reciente
  it('login exitoso → sessionUser.ultimaSesion es la fecha de la sesión ANTERIOR', async () => {
    // Primera sesión: no hay ultimaSesion previa → null
    const r1 = await auth.login('ana.tester@farmatrack.co', 'segura123');
    expect(r1.user.ultimaSesion).toBeNull();

    // Segunda sesión: debe ver la fecha guardada en el primer login
    const r2 = await auth.login('ana.tester@farmatrack.co', 'segura123');
    expect(r2.user.ultimaSesion).not.toBeNull();
    expect(typeof r2.user.ultimaSesion).toBe('string'); // ISO string
  });

  // [11] Primer login sin ultimaSesion previa → null en sesión
  it('primer login del usuario (sin ultimaSesion previa) → ultimaSesion = null', async () => {
    const r = await auth.login('luis.tester@farmatrack.co', 'clave456');
    expect(r.ok).toBe(true);
    expect(r.user.ultimaSesion).toBeNull();
  });

  // [12] Login fallido → findByEmail fue llamado pero el store NO cambia
  it('login fallido → ultimaSesion del usuario en el store no cambia', async () => {
    const antesDe = store.usuarios.find(u => u.id === 'u-t01').ultimaSesion;

    await auth.login('ana.tester@farmatrack.co', 'PASSWORD_INCORRECTA');

    const despues = store.usuarios.find(u => u.id === 'u-t01').ultimaSesion;
    expect(despues).toBe(antesDe); // sin cambios
  });

  // findByEmail del repo es case-insensitive
  it('login con email en mayúsculas → ok:true (repo es case-insensitive)', async () => {
    const r = await auth.login('ANA.TESTER@FARMATRACK.CO', 'segura123');
    expect(r.ok).toBe(true);
    expect(r.user.nombre).toBe('Ana Tester');
  });

  // [13] findAll devuelve todos los usuarios del store
  it('repo.findAll() devuelve todos los usuarios del store', async () => {
    const todos = await repo.findAll();
    expect(todos).toHaveLength(3);
    expect(todos.some(u => u.id === 'u-t01')).toBe(true);
    expect(todos.some(u => u.id === 'u-t03')).toBe(true);
  });

  // Login de inactivo → INACTIVE (verificado contra el store real)
  it('login de usuario inactivo → INACTIVE, aunque exista en el store', async () => {
    const r = await auth.login('inactivo@farmatrack.co', '1234');
    expect(r.ok).toBe(false);
    expect(r.code).toBe('INACTIVE');
    // El store no se modificó
    const enStore = store.usuarios.find(u => u.id === 'u-t03');
    expect(enStore.ultimaSesion).toBeUndefined();
  });

  // findByRol filtra correctamente
  it('repo.findByRol("operario") → devuelve solo los operarios activos', async () => {
    const operarios = await repo.findByRol('operario');
    // u-t02 está activo, u-t03 está inactivo → findByRol filtra inactivos
    expect(operarios.every(u => u.rol === 'operario' && u.activo !== false)).toBe(true);
  });
});
