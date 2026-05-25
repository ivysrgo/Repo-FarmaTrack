/**
 * tests/service/AuthService.branches.test.js
 *
 * CAJA BLANCA — Ramas no ejercidas por AuthService.test.js
 *
 * Ramas cubiertas:
 *   [1]  login → repo SÍ tiene touchLastLogin → se llama y su valor previo
 *                aparece en sessionUser.ultimaSesion
 *   [2]  login → repo NO tiene touchLastLogin → ultimaSesion queda null
 *   [3]  login → touchLastLogin devuelve null (primer login del usuario,
 *                sin sesión previa) → ultimaSesion = null en sesión
 *   [4]  sanitizeUser → usuario con _id (sin .id) → usa _id.toString()
 *   [5]  sanitizeUser → usuario sin id ni _id → id queda undefined
 */
'use strict';

const { AuthService } = require('../../src/service/AuthService');

function buildRepo(usuarios = [], extras = {}) {
  return {
    findByEmail: jest.fn(async email => {
      if (!email) return null;
      return usuarios.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
    }),
    ...extras,
  };
}

describe('AuthService — ramas de login (touchLastLogin)', () => {

  const usuarioActivo = {
    id: 'u-1', nombre: 'Ana', email: 'ana@x.co',
    password: 'pass1', rol: 'operario', cargo: 'OP', activo: true,
  };

  // [1] Repo CON touchLastLogin que devuelve una fecha previa
  it('con touchLastLogin disponible → ultimaSesion se incluye en el user de sesión', async () => {
    const prevDate = new Date('2026-05-01T10:00:00Z');
    const touchMock = jest.fn().mockResolvedValue(prevDate);
    const repo = buildRepo([usuarioActivo], { touchLastLogin: touchMock });
    const auth = new AuthService(repo);

    const r = await auth.login('ana@x.co', 'pass1');

    expect(r.ok).toBe(true);
    expect(touchMock).toHaveBeenCalledWith('u-1');
    expect(r.user.ultimaSesion).toBe(prevDate.toISOString());
  });

  // [2] Repo SIN touchLastLogin → rama `if typeof === 'function'` es false
  it('sin touchLastLogin en repo → ultimaSesion es null', async () => {
    const repo = buildRepo([usuarioActivo]); // sin touchLastLogin
    const auth = new AuthService(repo);

    const r = await auth.login('ana@x.co', 'pass1');

    expect(r.ok).toBe(true);
    expect(r.user.ultimaSesion).toBeNull();
  });

  // [3] touchLastLogin devuelve null (primer login, sin sesión previa guardada)
  it('touchLastLogin devuelve null → ultimaSesion = null en sesión', async () => {
    const touchMock = jest.fn().mockResolvedValue(null);
    const repo = buildRepo([usuarioActivo], { touchLastLogin: touchMock });
    const auth = new AuthService(repo);

    const r = await auth.login('ana@x.co', 'pass1');

    expect(r.ok).toBe(true);
    expect(r.user.ultimaSesion).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('AuthService — ramas de sanitizeUser', () => {

  const auth = new AuthService({ findByEmail: async () => null });

  // [4] Usuario con _id (objeto Mongoose sin .id) → debe usar _id.toString()
  it('usuario con _id y sin id → se usa _id.toString() como id', () => {
    const mongoDoc = {
      _id: { toString: () => 'mongo-abc-123' },
      nombre: 'Pedro', email: 'pedro@x.co',
      rol: 'director_tecnico', cargo: 'DT',
    };
    const safe = auth.sanitizeUser(mongoDoc);
    expect(safe.id).toBe('mongo-abc-123');
    expect(safe.nombre).toBe('Pedro');
  });

  // [5] Usuario sin id ni _id → id queda undefined (no debe reventar)
  it('usuario sin id ni _id → sanitizeUser no lanza excepción', () => {
    const u = { nombre: 'Sin ID', email: 'x@x.co', rol: 'operario', cargo: 'OP' };
    expect(() => auth.sanitizeUser(u)).not.toThrow();
    const safe = auth.sanitizeUser(u);
    expect(safe.nombre).toBe('Sin ID');
  });

  // Confirmar que toSession() tiene prioridad sobre el fallback manual
  it('toSession() tiene prioridad sobre la construcción manual del objeto', () => {
    const doc = {
      id: 'ignorado',
      toSession: () => ({ id: 'session-id', nombre: 'From toSession' }),
    };
    const safe = auth.sanitizeUser(doc);
    expect(safe.id).toBe('session-id');
    expect(safe.nombre).toBe('From toSession');
  });
});
