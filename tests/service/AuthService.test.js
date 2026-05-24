/**
 * tests/service/AuthService.test.js
 *
 * AuthService ahora recibe un usuarioRepo (no un store crudo) y es async.
 */
'use strict';

const { AuthService } = require('../../src/service/AuthService');

// Mock repo - emula UsuarioRepository (memoria) / UsuarioRepositoryMongo
function buildMockRepo(usuarios = []) {
  return {
    _usuarios: usuarios,
    findByEmail: jest.fn(async (email) => {
      if (!email || typeof email !== 'string') return null;
      const norm = email.toLowerCase().trim();
      return usuarios.find(u => u.email.toLowerCase() === norm) || null;
    }),
  };
}

describe('AuthService (async)', () => {
  let repo;
  let auth;

  beforeEach(() => {
    repo = buildMockRepo([
      { id: 'u1', nombre: 'Juan Bahos',  email: 'juan@x.co',   password: '1234',  rol: 'director_tecnico', cargo: 'DT', activo: true  },
      { id: 'u2', nombre: 'Sergio V',     email: 'sergio@x.co', password: 'pwd2',  rol: 'operario',         cargo: 'OP', activo: true  },
      { id: 'u3', nombre: 'Inactivo',     email: 'in@x.co',     password: '1234',  rol: 'operario',         cargo: 'OP', activo: false },
    ]);
    auth = new AuthService(repo);
  });

  describe('constructor', () => {
    it('lanza si no recibe usuarioRepo', () => {
      expect(() => new AuthService()).toThrow(/usuarioRepo/);
    });
    it('lanza si el repo no tiene findByEmail', () => {
      expect(() => new AuthService({})).toThrow(/findByEmail/);
    });
    it('acepta un repo valido', () => {
      expect(() => new AuthService({ findByEmail: () => null })).not.toThrow();
    });
  });

  describe('findUserByEmail', () => {
    it('encuentra por email exacto', async () => {
      const u = await auth.findUserByEmail('juan@x.co');
      expect(u.id).toBe('u1');
    });
    it('es case-insensitive', async () => {
      const u = await auth.findUserByEmail('JUAN@X.CO');
      expect(u.id).toBe('u1');
    });
    it('null si no existe', async () => {
      expect(await auth.findUserByEmail('fantasma@x.co')).toBeNull();
    });
    it('null para email vacio/null/undefined', async () => {
      expect(await auth.findUserByEmail('')).toBeNull();
      expect(await auth.findUserByEmail(null)).toBeNull();
      expect(await auth.findUserByEmail(undefined)).toBeNull();
    });
  });

  describe('sanitizeUser', () => {
    it('NO incluye password', () => {
      const safe = auth.sanitizeUser(repo._usuarios[0]);
      expect(safe).not.toHaveProperty('password');
    });
    it('NO incluye activo', () => {
      const safe = auth.sanitizeUser(repo._usuarios[0]);
      expect(safe).not.toHaveProperty('activo');
    });
    it('preserva los 5 campos seguros', () => {
      const safe = auth.sanitizeUser(repo._usuarios[0]);
      expect(safe).toEqual({
        id: 'u1', nombre: 'Juan Bahos', email: 'juan@x.co', rol: 'director_tecnico', cargo: 'DT',
      });
    });
    it('retorna null si recibe null/undefined', () => {
      expect(auth.sanitizeUser(null)).toBeNull();
      expect(auth.sanitizeUser(undefined)).toBeNull();
    });
    it('usa toSession() si el objeto lo tiene (caso Mongoose doc)', () => {
      const doc = { toSession: () => ({ id: 'mongo-id', nombre: 'M' }) };
      expect(auth.sanitizeUser(doc).id).toBe('mongo-id');
    });
  });

  describe('login - exito', () => {
    it('retorna ok:true con user sanitizado para credenciales validas', async () => {
      const r = await auth.login('juan@x.co', '1234');
      expect(r.ok).toBe(true);
      expect(r.user.id).toBe('u1');
    });
    it('NUNCA incluye password en la respuesta', async () => {
      const r = await auth.login('juan@x.co', '1234');
      expect(r.user).not.toHaveProperty('password');
    });
    it('case-insensitive en email', async () => {
      expect((await auth.login('JUAN@X.CO', '1234')).ok).toBe(true);
    });
    it('distingue rol operario vs director', async () => {
      expect((await auth.login('juan@x.co', '1234')).user.rol).toBe('director_tecnico');
      expect((await auth.login('sergio@x.co', 'pwd2')).user.rol).toBe('operario');
    });
  });

  describe('login - errores', () => {
    it('MISSING_FIELDS si falta email', async () => {
      expect((await auth.login('', '1234')).code).toBe('MISSING_FIELDS');
    });
    it('MISSING_FIELDS si falta password', async () => {
      expect((await auth.login('juan@x.co', '')).code).toBe('MISSING_FIELDS');
    });
    it('MISSING_FIELDS si ambos undefined', async () => {
      expect((await auth.login(undefined, undefined)).code).toBe('MISSING_FIELDS');
    });
    it('INVALID_CREDENTIALS si email no existe', async () => {
      const r = await auth.login('fantasma@x.co', '1234');
      expect(r.code).toBe('INVALID_CREDENTIALS');
    });
    it('INVALID_CREDENTIALS si password incorrecta', async () => {
      expect((await auth.login('juan@x.co', 'mal')).code).toBe('INVALID_CREDENTIALS');
    });
    it('mismo mensaje email-no-existe vs password-mal (anti-enumeracion)', async () => {
      const a = await auth.login('fantasma@x.co', 'x');
      const b = await auth.login('juan@x.co', 'mal');
      expect(a.error).toBe(b.error);
    });
    it('INACTIVE si el usuario esta inactivo', async () => {
      const r = await auth.login('in@x.co', '1234');
      expect(r.code).toBe('INACTIVE');
    });
    it('no expone la password real en respuesta de error', async () => {
      const r = await auth.login('juan@x.co', 'mal');
      expect(JSON.stringify(r)).not.toContain('1234');
    });
  });
});
