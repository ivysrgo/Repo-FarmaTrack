/**
 * tests/data/formulas.test.js
 *
 * Cubre el catálogo de fórmulas y los helpers getFormula/listarProductos/
 * validarValoresPaso. Estos helpers son la base de la validación BPM.
 */
'use strict';

const { FORMULAS, getFormula, listarProductos, validarValoresPaso } = require('../../src/data/formulas');

describe('data/formulas', () => {
  describe('FORMULAS catálogo', () => {
    it('expone los 5 productos del seed', () => {
      expect(Object.keys(FORMULAS)).toEqual(expect.arrayContaining([
        'Amoxicilina 500 mg',
        'Ibuprofeno 400 mg',
        'Metformina 850 mg',
        'Loratadina 10 mg',
        'Enalapril 10 mg',
      ]));
    });

    it('cada fórmula tiene paso2.materias con min/max numéricos', () => {
      Object.values(FORMULAS).forEach(f => {
        expect(Array.isArray(f.paso2.materias)).toBe(true);
        f.paso2.materias.forEach(m => {
          expect(typeof m.min).toBe('number');
          expect(typeof m.max).toBe('number');
          expect(m.min).toBeLessThanOrEqual(m.max);
        });
      });
    });

    it('cada fórmula tiene paso5.controles con min/max', () => {
      Object.values(FORMULAS).forEach(f => {
        expect(Array.isArray(f.paso5.controles)).toBe(true);
        f.paso5.controles.forEach(c => {
          expect(typeof c.min).toBe('number');
          expect(typeof c.max).toBe('number');
        });
      });
    });
  });

  describe('getFormula', () => {
    it('match exacto', () => {
      expect(getFormula('Amoxicilina 500 mg')).toBeDefined();
    });
    it('match case-insensitive con espacios', () => {
      expect(getFormula('  amoxicilina   500 MG  ')).toBeDefined();
    });
    it('null si producto no catalogado', () => {
      expect(getFormula('XYZ 999 mg')).toBeNull();
    });
    it('null si null/undefined/vacío', () => {
      expect(getFormula(null)).toBeNull();
      expect(getFormula(undefined)).toBeNull();
      expect(getFormula('')).toBeNull();
    });
  });

  describe('listarProductos', () => {
    it('devuelve array de strings (5 elementos)', () => {
      const list = listarProductos();
      expect(Array.isArray(list)).toBe(true);
      expect(list).toHaveLength(5);
      list.forEach(p => expect(typeof p).toBe('string'));
    });
  });

  describe('validarValoresPaso', () => {
    const f = getFormula('Amoxicilina 500 mg');

    it('ok:true si formula es null (producto no catalogado)', () => {
      const r = validarValoresPaso(null, 2, { materias: [{ recibida: '999' }] });
      expect(r.ok).toBe(true);
    });

    it('paso 2 - todas las MPs dentro de rango → ok', () => {
      const materias = f.paso2.materias.map(m => ({ recibida: String(m.espNum), estado: 'conforme' }));
      const r = validarValoresPaso(f, 2, { materias });
      expect(r.ok).toBe(true);
    });

    it('paso 2 - una MP por debajo del mínimo → error con mensaje BPM', () => {
      const materias = f.paso2.materias.map((m, i) => ({
        recibida: i === 0 ? String(m.min - 10) : String(m.espNum),
        estado: 'conforme',
      }));
      const r = validarValoresPaso(f, 2, { materias });
      expect(r.ok).toBe(false);
      expect(r.errores[0].mensaje).toMatch(/rango BPM/i);
    });

    it('paso 2 - una MP por encima del máximo → error', () => {
      const materias = f.paso2.materias.map((m, i) => ({
        recibida: i === 0 ? String(m.max + 50) : String(m.espNum),
      }));
      const r = validarValoresPaso(f, 2, { materias });
      expect(r.ok).toBe(false);
    });

    it('paso 2 - valor vacío NO falla (no se valida)', () => {
      const materias = f.paso2.materias.map(() => ({ recibida: '', estado: '' }));
      const r = validarValoresPaso(f, 2, { materias });
      expect(r.ok).toBe(true);
    });

    it('paso 2 - valor no numérico se ignora silenciosamente', () => {
      const materias = f.paso2.materias.map(() => ({ recibida: 'abc' }));
      const r = validarValoresPaso(f, 2, { materias });
      expect(r.ok).toBe(true);
    });

    it('paso 3 - reusa rangos de paso2.materias', () => {
      const pesos = f.paso2.materias.map(m => ({ registrado: String(m.min - 100) }));
      const r = validarValoresPaso(f, 3, { pesos });
      expect(r.ok).toBe(false);
      expect(r.errores.length).toBe(f.paso2.materias.length);
    });

    it('paso 4 - temp_mezcla fuera de rango → error', () => {
      const r = validarValoresPaso(f, 4, { temp_mezcla: '99', temp_amasado: String(f.paso4.parametros.temp_amasado.nominal) });
      expect(r.ok).toBe(false);
      expect(r.errores[0].mensaje).toMatch(/Temperatura de mezcla/i);
    });

    it('paso 4 - temp_amasado fuera de rango → error', () => {
      const r = validarValoresPaso(f, 4, { temp_amasado: '5' });
      expect(r.ok).toBe(false);
    });

    it('paso 5 - control con valor dentro del rango → ok', () => {
      const controles = f.paso5.controles.map(c => ({ valor: String((c.min + c.max) / 2) }));
      const r = validarValoresPaso(f, 5, { controles });
      expect(r.ok).toBe(true);
    });

    it('paso 5 - un control fuera de rango → error', () => {
      const controles = f.paso5.controles.map((c, i) => ({
        valor: i === 0 ? String(c.max + 100) : String((c.min + c.max) / 2),
      }));
      const r = validarValoresPaso(f, 5, { controles });
      expect(r.ok).toBe(false);
    });

    it('paso sin definición en fórmula (ej. paso 6) → no valida nada', () => {
      const r = validarValoresPaso(f, 6, { cant_obtenida: '999' });
      expect(r.ok).toBe(true);
    });

    it('acepta valores con coma decimal (ej. "27,5")', () => {
      const r = validarValoresPaso(f, 4, {
        temp_mezcla:  '27,5',
        temp_amasado: '30,0',
      });
      expect(r.ok).toBe(true);
    });
  });
});
