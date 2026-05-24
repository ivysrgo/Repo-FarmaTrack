/**
 * tests/repositories/UsuarioRepository.test.js
 *
 * Cubre el repo en memoria. Inyectamos un store local en cada test para
 * aislar (el singleton lee de config/database mock).
 */
'use strict';

const { UsuarioRepository } = require('../../src/repositories/UsuarioRepository');

function buildStore(usuarios = []) {
  return { usuarios };
}

describe('UsuarioRepository (memoria)', () => {
  let store;
  let repo;
  beforeEach(() => {
    store = buildStore([
      { id: 'u-001', nombre: 'Juan', email: 'juan@x.co', password: '1234', rol: 'director_tecnico', activo: true },
      { id: 'u-002', nombre: 'Sergio', email: 'sergio@x.co', password: '1234', rol: 'operario', activo: true },
      { id: 'u-003', nombre: 'Inactivo', email: 'in@x.co', password: '1234', rol: 'operario', activo: false },
    ]);
    repo = new UsuarioRepository(store);
  });

  describe('constructor', () => {
    it('lanza si no recibe store', () => {
      expect(() => new UsuarioRepository(null)).toThrow();
    });
    it('lanza si store no tiene usuarios:[]', () => {
      expect(() => new UsuarioRepository({})).toThrow();
    });
  });

  describe('findByEmail', () => {
    it('encuentra exacto', async () => {
      expect((await repo.findByEmail('juan@x.co')).id).toBe('u-001');
    });
    it('case-insensitive y con trim', async () => {
      expect((await repo.findByEmail('  JUAN@X.CO  ')).id).toBe('u-001');
    });
    it('null si no existe', async () => {
      expect(await repo.findByEmail('xx@x.co')).toBeNull();
    });
    it('null si email vacío/no string', async () => {
      expect(await repo.findByEmail('')).toBeNull();
      expect(await repo.findByEmail(123)).toBeNull();
    });
  });

  describe('findById', () => {
    it('encuentra por id', async () => {
      expect((await repo.findById('u-001')).nombre).toBe('Juan');
    });
    it('null si no existe', async () => {
      expect(await repo.findById('u-xxx')).toBeNull();
    });
    it('null para id falsy', async () => {
      expect(await repo.findById(null)).toBeNull();
      expect(await repo.findById('')).toBeNull();
    });
  });

  describe('findByRol', () => {
    it('filtra por rol y excluye inactivos', async () => {
      const ops = await repo.findByRol('operario');
      expect(ops).toHaveLength(1);
      expect(ops[0].id).toBe('u-002');
    });
    it('array vacío para rol vacío', async () => {
      expect(await repo.findByRol('')).toEqual([]);
    });
    it('array vacío si nadie tiene ese rol', async () => {
      expect(await repo.findByRol('calidad')).toEqual([]);
    });
  });

  describe('findAll', () => {
    it('devuelve copia (no la referencia interna)', async () => {
      const a = await repo.findAll();
      a.push({ id: 'extra' });
      expect(store.usuarios).toHaveLength(3);
    });
  });

  describe('create', () => {
    it('asigna id auto-incremental', async () => {
      const u = await repo.create({ nombre: 'Nuevo', email: 'n@x.co', rol: 'operario' });
      expect(u.id).toMatch(/^u-\d{3}$/);
      expect(store.usuarios).toHaveLength(4);
    });
  });

  describe('countAll', () => {
    it('cuenta total', async () => {
      expect(await repo.countAll()).toBe(3);
    });
  });

  describe('touchLastLogin', () => {
    it('marca timestamp y devuelve el anterior (null la primera vez)', async () => {
      const prev = await repo.touchLastLogin('u-001');
      expect(prev).toBeNull();
      expect(store.usuarios[0].ultimaSesion).toBeInstanceOf(Date);
    });
    it('segunda llamada devuelve el timestamp de la primera', async () => {
      await repo.touchLastLogin('u-001');
      const prev = await repo.touchLastLogin('u-001');
      expect(prev).toBeInstanceOf(Date);
    });
    it('null si id no existe', async () => {
      expect(await repo.touchLastLogin('u-xxx')).toBeNull();
    });
  });
});
