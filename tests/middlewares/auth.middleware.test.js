/**
 * tests/middlewares/auth.test.js
 *
 * CAJA BLANCA — Cobertura de todas las ramas de src/middlewares/auth.js
 *
 * El archivo tiene dos funciones: injectUser y requireAuth.
 * Cada rama if/else se cubre explícitamente.
 *
 * Ramas cubiertas:
 *   injectUser:
 *     [1]  req.session existe y tiene usuario → lo copia a res.locals
 *     [2]  req.session existe pero sin usuario → res.locals = null
 *     [3]  req.session es undefined → res.locals = null (no revienta)
 *     [4]  req.session es null → res.locals = null (no revienta)
 *     [5]  siempre llama a next()
 *
 *   requireAuth:
 *     [6]  sesión válida → llama a next(), NO redirige
 *     [7]  sin sesión + req.flash disponible → emite flash de error + redirige
 *     [8]  sin sesión + SIN req.flash → NO revienta (req.flash es opcional)
 *     [9]  sin sesión → siempre redirige a /auth/login
 *     [10] sesión válida → inyecta usuario en res.locals
 */
'use strict';

const { injectUser, requireAuth } = require('../../src/middlewares/auth');

// ─── helpers ──────────────────────────────────────────────────────────────────

function makeReq(sessionOverride) {
  return { session: sessionOverride };
}

function makeRes() {
  const res = { locals: {} };
  res.redirect = jest.fn();
  return res;
}

const next = () => jest.fn();

const usuarioEjemplo = { id: 'u-1', nombre: 'Test', rol: 'operario' };

// ─── injectUser ───────────────────────────────────────────────────────────────

describe('injectUser', () => {

  // [1] Sesión con usuario → lo inyecta
  it('sesión con usuario → copia usuario a res.locals.currentUser', () => {
    const req = makeReq({ usuario: usuarioEjemplo });
    const res = makeRes();
    const nextFn = next();

    injectUser(req, res, nextFn);

    expect(res.locals.currentUser).toBe(usuarioEjemplo);
    expect(nextFn).toHaveBeenCalledTimes(1);
  });

  // [2] Sesión sin usuario → null
  it('sesión sin usuario → res.locals.currentUser = null', () => {
    const req = makeReq({});
    const res = makeRes();
    const nextFn = next();

    injectUser(req, res, nextFn);

    expect(res.locals.currentUser).toBeNull();
    expect(nextFn).toHaveBeenCalledTimes(1);
  });

  // [3] req.session undefined → null, no revienta
  it('req.session = undefined → res.locals.currentUser = null sin lanzar', () => {
    const req = makeReq(undefined);
    const res = makeRes();
    const nextFn = next();

    expect(() => injectUser(req, res, nextFn)).not.toThrow();
    expect(res.locals.currentUser).toBeNull();
    expect(nextFn).toHaveBeenCalled();
  });

  // [4] req.session null → null, no revienta
  it('req.session = null → res.locals.currentUser = null sin lanzar', () => {
    const req = makeReq(null);
    const res = makeRes();
    const nextFn = next();

    expect(() => injectUser(req, res, nextFn)).not.toThrow();
    expect(res.locals.currentUser).toBeNull();
  });

  // [5] siempre llama a next(), incluso con sesión válida
  it('siempre llama a next() independientemente del estado de la sesión', () => {
    [
      { usuario: usuarioEjemplo },
      {},
      undefined,
      null,
    ].forEach(sessionVal => {
      const nextFn = next();
      injectUser(makeReq(sessionVal), makeRes(), nextFn);
      expect(nextFn).toHaveBeenCalledTimes(1);
    });
  });
});

// ─── requireAuth ──────────────────────────────────────────────────────────────

describe('requireAuth', () => {

  // [6] Sesión válida → llama next(), NO redirige
  it('sesión válida → llama a next() y NO redirige', () => {
    const req = { session: { usuario: usuarioEjemplo }, flash: jest.fn() };
    const res = makeRes();
    const nextFn = next();

    requireAuth(req, res, nextFn);

    expect(nextFn).toHaveBeenCalledTimes(1);
    expect(res.redirect).not.toHaveBeenCalled();
  });

  // [10] Sesión válida → inyecta el usuario en res.locals
  it('sesión válida → inyecta usuario en res.locals.currentUser', () => {
    const req = { session: { usuario: usuarioEjemplo }, flash: jest.fn() };
    const res = makeRes();

    requireAuth(req, res, next());

    expect(res.locals.currentUser).toBe(usuarioEjemplo);
  });

  // [9] Sin sesión → siempre redirige a /auth/login
  it('sin sesión → redirige a /auth/login', () => {
    const req = { session: {}, flash: jest.fn() };
    const res = makeRes();

    requireAuth(req, res, next());

    expect(res.redirect).toHaveBeenCalledWith('/auth/login');
  });

  // [7] Sin sesión + flash disponible → emite mensaje de error
  it('sin sesión + req.flash disponible → emite flash "error"', () => {
    const flashMock = jest.fn();
    const req = { session: {}, flash: flashMock };
    const res = makeRes();

    requireAuth(req, res, next());

    expect(flashMock).toHaveBeenCalledWith('error', expect.stringMatching(/iniciar sesion/i));
  });

  // [8] Sin sesión + SIN req.flash → no lanza, igual redirige
  it('sin sesión y sin req.flash → no revienta y redirige a /auth/login', () => {
    const req = { session: {} }; // sin flash
    const res = makeRes();

    expect(() => requireAuth(req, res, next())).not.toThrow();
    expect(res.redirect).toHaveBeenCalledWith('/auth/login');
  });

  // req.session undefined → redirige
  it('req.session undefined → redirige a /auth/login', () => {
    const req = { flash: jest.fn() }; // sin session
    const res = makeRes();

    requireAuth(req, res, next());

    expect(res.redirect).toHaveBeenCalledWith('/auth/login');
  });
});
