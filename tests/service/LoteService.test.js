/**
 * tests/service/LoteService.test.js
 *
 * LoteService es async ahora. El mock repo tambien devuelve Promises.
 */
'use strict';

const { LoteService } = require('../../src/service/LoteService');

function buildMockRepo(seed = []) {
  const lotes = seed.map((l, i) => ({ id: i + 1, ...l }));
  let nextId = lotes.length + 1;
  return {
    _lotes: lotes,
    findAll: jest.fn(async filtros => {
      let r = [...lotes];
      if (filtros && filtros.estado) r = r.filter(l => l.estado === filtros.estado);
      return r;
    }),
    findById: jest.fn(async id => {
      const num = parseInt(id, 10);
      return lotes.find(l => l.id === num) || null;
    }),
    create: jest.fn(async data => {
      const nuevo = { id: nextId++, ...data, estadoLabel: data.estado || 'En espera' };
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

describe('LoteService (async)', () => {
  let repo;
  let svc;

  beforeEach(() => {
    repo = buildMockRepo([
      { numeroLote: 'FT-001', producto: 'Amox',  estado: 'en_produccion',   pasoActual: 5, operario: 'Carlos',  directorTecnico: 'DT', observaciones: 'sin obs' },
      { numeroLote: 'FT-002', producto: 'Ibu',   estado: 'pendiente_firma', pasoActual: 9, operario: 'Luisa',   directorTecnico: 'DT', observaciones: '' },
      { numeroLote: 'FT-003', producto: 'Metf',  estado: 'liberado',        pasoActual: 9, operario: 'Maria',   directorTecnico: 'DT', observaciones: '' },
      { numeroLote: 'FT-004', producto: 'Lora',  estado: 'rechazado',       pasoActual: 4, operario: 'Felipe',  directorTecnico: 'DT', observaciones: '' },
      { numeroLote: 'FT-005', producto: 'Enal',  estado: 'en_espera',       pasoActual: 1, operario: 'Andres',  directorTecnico: 'DT', observaciones: '' },
    ]);
    svc = new LoteService(repo);
  });

  describe('constructor', () => {
    it('lanza si no recibe repo', () => {
      expect(() => new LoteService()).toThrow(/loteRepo/);
    });
  });

  describe('queries passthrough', () => {
    it('findAll delega al repo', async () => {
      expect(await svc.findAll()).toHaveLength(5);
      expect(repo.findAll).toHaveBeenCalled();
    });
    it('findById delega', async () => {
      expect((await svc.findById(1)).numeroLote).toBe('FT-001');
    });
    it('stats delega', async () => {
      expect((await svc.stats()).total).toBe(5);
    });
  });

  describe('validateNuevaOrden', () => {
    const validBody = () => ({
      numeroOrden: 'OP-100', codigoLote: 'FT-100', producto: 'X',
      cantidad: '500', fechaInicio: '2026-05-22', operario: 'a',
      jefeCalidad: 'b', area: 'c',
      confirmFormula: '1', confirmMaterias: '1', confirmEquipos: '1',
    });

    it('cuerpo valido pasa', () => {
      expect(svc.validateNuevaOrden(validBody())).toEqual([]);
    });
    it('falta numeroOrden', () => {
      const b = validBody(); b.numeroOrden = '';
      expect(svc.validateNuevaOrden(b).some(e => /orden/i.test(e))).toBe(true);
    });
    it('falta codigoLote', () => {
      const b = validBody(); b.codigoLote = '   ';
      expect(svc.validateNuevaOrden(b).some(e => /lote/i.test(e))).toBe(true);
    });
    it('falta producto', () => {
      const b = validBody(); b.producto = '';
      expect(svc.validateNuevaOrden(b).some(e => /producto/i.test(e))).toBe(true);
    });
    it('cantidad < 100', () => {
      const b = validBody(); b.cantidad = '50';
      expect(svc.validateNuevaOrden(b).some(e => /cantidad/i.test(e))).toBe(true);
    });
    it('falta fechaInicio', () => {
      const b = validBody(); b.fechaInicio = '';
      expect(svc.validateNuevaOrden(b).some(e => /fecha/i.test(e))).toBe(true);
    });
    it('faltan los 3 confirms', () => {
      const b = validBody();
      delete b.confirmFormula; delete b.confirmMaterias; delete b.confirmEquipos;
      const errs = svc.validateNuevaOrden(b);
      expect(errs.some(e => /formula/i.test(e))).toBe(true);
      expect(errs.some(e => /materias/i.test(e))).toBe(true);
      expect(errs.some(e => /equipos/i.test(e))).toBe(true);
    });
    it('body undefined/null no revienta', () => {
      expect(() => svc.validateNuevaOrden(undefined)).not.toThrow();
      expect(() => svc.validateNuevaOrden(null)).not.toThrow();
    });
  });

  describe('crearOrden', () => {
    const validBody = () => ({
      numeroOrden: 'OP-100', codigoLote: 'FT-100', producto: 'X',
      cantidad: '500', fechaInicio: '2026-05-22', operario: 'a',
      jefeCalidad: 'b', area: 'c',
      confirmFormula: '1', confirmMaterias: '1', confirmEquipos: '1',
    });

    it('crea lote OK', async () => {
      const r = await svc.crearOrden(validBody(), 'DT Fallback');
      expect(r.ok).toBe(true);
      expect(r.lote.numeroLote).toBe('FT-100');
      expect(repo.create).toHaveBeenCalled();
    });
    it('retorna ok:false con errores si valida falla', async () => {
      const r = await svc.crearOrden({}, 'DT');
      expect(r.ok).toBe(false);
      expect(r.errores.length).toBeGreaterThan(0);
      expect(repo.create).not.toHaveBeenCalled();
    });
    it('usa directorFallback si no viene en body', async () => {
      await svc.crearOrden(validBody(), 'Mi DT');
      expect(repo.create.mock.calls[0][0].directorTecnico).toBe('Mi DT');
    });
    it('respeta directorTecnico explicito', async () => {
      const b = validBody(); b.directorTecnico = 'DT Body';
      await svc.crearOrden(b, 'DT Fallback');
      expect(repo.create.mock.calls[0][0].directorTecnico).toBe('DT Body');
    });
    it('lote nuevo arranca con en_espera y paso 1', async () => {
      await svc.crearOrden(validBody(), 'DT');
      const args = repo.create.mock.calls[0][0];
      expect(args.estado).toBe('en_espera');
      expect(args.pasoActual).toBe(1);
    });
    it('parsea cantidad a int', async () => {
      await svc.crearOrden(validBody(), 'DT');
      expect(repo.create.mock.calls[0][0].cantidadPlanificada).toBe(500);
    });
  });

  describe('canLiberar', () => {
    it('NOT_FOUND si lote null', () => {
      expect(svc.canLiberar(null)).toEqual({ ok: false, code: 'NOT_FOUND', reason: expect.any(String) });
    });
    it('YA_LIBERADO si liberado', () => {
      expect(svc.canLiberar({ estado: 'liberado' }).code).toBe('YA_LIBERADO');
    });
    it('RECHAZADO si rechazado', () => {
      expect(svc.canLiberar({ estado: 'rechazado' }).code).toBe('RECHAZADO');
    });
    it('ok:true para estados liberables', () => {
      expect(svc.canLiberar({ estado: 'en_produccion' }).ok).toBe(true);
      expect(svc.canLiberar({ estado: 'pendiente_firma' }).ok).toBe(true);
      expect(svc.canLiberar({ estado: 'en_calidad' }).ok).toBe(true);
    });
  });

  describe('liberar', () => {
    it('libera correctamente', async () => {
      const r = await svc.liberar(1, 'Juan DT');
      expect(r.ok).toBe(true);
      expect(r.lote.estado).toBe('liberado');
      expect(r.lote.pasoActual).toBe(9);
      expect(r.lote.liberadoPor).toBe('Juan DT');
      expect(r.lote.liberadoEn).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
    it('NOT_FOUND si no existe', async () => {
      expect((await svc.liberar(999, 'Juan')).code).toBe('NOT_FOUND');
    });
    it('YA_LIBERADO', async () => {
      expect((await svc.liberar(3, 'Juan')).code).toBe('YA_LIBERADO');
    });
    it('RECHAZADO', async () => {
      expect((await svc.liberar(4, 'Juan')).code).toBe('RECHAZADO');
    });
    it('firmante null cae al directorTecnico del lote', async () => {
      const r = await svc.liberar(1, null);
      expect(r.lote.liberadoPor).toBe('DT');
    });
    it('si firmante y DT vacios usa "Director Tecnico"', async () => {
      repo._lotes[0].directorTecnico = '';
      const r = await svc.liberar(1, null);
      expect(r.lote.liberadoPor).toBe('Director Tecnico');
    });
  });

  describe('avanzarOperario', () => {
    it('pasos 1-8: avanza paso y guarda obs', async () => {
      const r = await svc.avanzarOperario(1, 5, 'mis obs');
      expect(r.ok).toBe(true);
      expect(r.accion).toBe('avanzado');
      expect(r.lote.pasoActual).toBe(6);
      expect(r.lote.observaciones).toBe('mis obs');
    });
    it('si venia de en_espera, pasa a en_produccion', async () => {
      const r = await svc.avanzarOperario(5, 1, '');
      expect(r.lote.estado).toBe('en_produccion');
    });
    it('paso 9: pendiente_firma + accion=notificado', async () => {
      const r = await svc.avanzarOperario(1, 9, 'listo');
      expect(r.ok).toBe(true);
      expect(r.accion).toBe('notificado');
      expect(r.lote.estado).toBe('pendiente_firma');
    });
    it('paso 9 ya pendiente -> YA_NOTIFICADO', async () => {
      expect((await svc.avanzarOperario(2, 9, '')).code).toBe('YA_NOTIFICADO');
    });
    it('paso 9 sobre liberado -> YA_NOTIFICADO', async () => {
      expect((await svc.avanzarOperario(3, 9, '')).code).toBe('YA_NOTIFICADO');
    });
    it('NOT_FOUND si no existe', async () => {
      expect((await svc.avanzarOperario(999, 5, '')).code).toBe('NOT_FOUND');
    });
    it('INVALID_STEP fuera de rango', async () => {
      expect((await svc.avanzarOperario(1, 0, '')).code).toBe('INVALID_STEP');
      expect((await svc.avanzarOperario(1, 99, '')).code).toBe('INVALID_STEP');
    });
    it('INVALID_STEP si no numerico', async () => {
      expect((await svc.avanzarOperario(1, 'abc', '')).code).toBe('INVALID_STEP');
    });
    it('observaciones no string -> preserva las del lote', async () => {
      const r = await svc.avanzarOperario(1, 5, undefined);
      expect(r.lote.observaciones).toBe('sin obs');
    });
    it('observaciones vacias -> preserva las del lote', async () => {
      const r = await svc.avanzarOperario(1, 5, '   ');
      expect(r.lote.observaciones).toBe('sin obs');
    });
    it('pasoActual nunca decrece', async () => {
      const r = await svc.avanzarOperario(1, 2, '');
      expect(r.lote.pasoActual).toBe(5);
    });
  });
});
