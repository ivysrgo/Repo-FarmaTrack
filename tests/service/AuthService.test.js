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
    create: jest.fn(async (data) => {
      const nuevo = { id: 'u-' + (usuarios.length + 1), ...data };
      usuarios.push(nuevo);
      return nuevo;
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

  describe('registrar - validaciones', () => {
    const okBody = {
      nombre: 'Nuevo Usuario',
      email: 'nuevo@farmatrack.co',
      password: 'pass1234',
      confirmPassword: 'pass1234',
      rol: 'operario',
      terminos: true,
    };

    it('body válido → crea y devuelve user sanitizado', async () => {
      const r = await auth.registrar(okBody);
      expect(r.ok).toBe(true);
      expect(r.user.email).toBe('nuevo@farmatrack.co');
      expect(r.user.rol).toBe('operario');
      expect(r.user).not.toHaveProperty('password');
      expect(repo.create).toHaveBeenCalled();
    });

    it('cargo se infiere del rol', async () => {
      await auth.registrar({ ...okBody, rol: 'director_tecnico' });
      const arg = repo.create.mock.calls[0][0];
      expect(arg.cargo).toBe('Director Tecnico');
    });

    it('VALIDATION si falta nombre', async () => {
      const r = await auth.registrar({ ...okBody, nombre: '' });
      expect(r.ok).toBe(false);
      expect(r.code).toBe('VALIDATION');
      expect(r.error).toMatch(/nombre/i);
    });

    it('VALIDATION si email no es de @farmatrack.co', async () => {
      const r = await auth.registrar({ ...okBody, email: 'malo@gmail.com' });
      expect(r.ok).toBe(false);
      expect(r.error).toMatch(/@farmatrack\.co/i);
    });

    it('VALIDATION si email no tiene formato válido', async () => {
      const r = await auth.registrar({ ...okBody, email: 'no-es-email' });
      expect(r.ok).toBe(false);
      expect(r.error).toMatch(/correo/i);
    });

    it('VALIDATION si password < 4 chars', async () => {
      const r = await auth.registrar({ ...okBody, password: '12', confirmPassword: '12' });
      expect(r.ok).toBe(false);
      expect(r.error).toMatch(/contrase/i);
    });

    it('VALIDATION si las contraseñas no coinciden', async () => {
      const r = await auth.registrar({ ...okBody, confirmPassword: 'distinta' });
      expect(r.ok).toBe(false);
      expect(r.error).toMatch(/no coinciden/i);
    });

    it('VALIDATION si rol no es operario ni director_tecnico', async () => {
      const r = await auth.registrar({ ...okBody, rol: 'calidad' });
      expect(r.ok).toBe(false);
      expect(r.error).toMatch(/rol/i);
    });

    it('VALIDATION si no acepta términos', async () => {
      const r = await auth.registrar({ ...okBody, terminos: false });
      expect(r.ok).toBe(false);
      expect(r.error).toMatch(/términos/i);
    });

    it('DUPLICATE_EMAIL si ya existe ese correo', async () => {
      await auth.registrar(okBody);
      const r = await auth.registrar(okBody);
      expect(r.ok).toBe(false);
      expect(r.code).toBe('DUPLICATE_EMAIL');
    });

    it('DUPLICATE_EMAIL si el repo lanza E11000 (race condition)', async () => {
      repo.create.mockImplementationOnce(async () => {
        const err = new Error('duplicate'); err.code = 11000; throw err;
      });
      const r = await auth.registrar({ ...okBody, email: 'otro@farmatrack.co' });
      expect(r.ok).toBe(false);
      expect(r.code).toBe('DUPLICATE_EMAIL');
    });

    it('PERSIST_ERROR si el repo lanza un error genérico', async () => {
      repo.create.mockImplementationOnce(async () => { throw new Error('boom'); });
      const r = await auth.registrar({ ...okBody, email: 'otro2@farmatrack.co' });
      expect(r.ok).toBe(false);
      expect(r.code).toBe('PERSIST_ERROR');
    });

    it('email se normaliza a lowercase antes de persistir', async () => {
      await auth.registrar({ ...okBody, email: 'MAYUS@FARMATRACK.CO' });
      const arg = repo.create.mock.calls[0][0];
      expect(arg.email).toBe('mayus@farmatrack.co');
    });

    it('body undefined no revienta', async () => {
      await expect(auth.registrar()).resolves.toHaveProperty('ok', false);
    });
  });
});
