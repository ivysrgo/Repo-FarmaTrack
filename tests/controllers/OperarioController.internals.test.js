/**
 * tests/controllers/OperarioController.internals.test.js
 *
 * Tests directos de extractPasoData y validarPasoCompleto (exportados como
 * _extractPasoData / _validarPasoCompleto para testing). Estas dos funciones
 * son el corazón de la captura + validación del operario y vale la pena
 * cubrirlas exhaustivamente.
 */
'use strict';

const operario = require('../../src/controllers/OperarioController');
const extract  = operario._extractPasoData;
const validar  = operario._validarPasoCompleto;

describe('extractPasoData', () => {
  it('paso 1: captura observaciones y checks chk_*', () => {
    const d = extract(1, { observaciones: '  obs  ', chk_orden_recibida: '1', otro: 'x' });
    expect(d.observaciones).toBe('obs');
    expect(d.chk_orden_recibida).toBe(true);
    expect(d.otro).toBeUndefined();
  });

  it('paso 2: agrupa materias mp_N_*', () => {
    const d = extract(2, { mp_0_recibida: '100', mp_0_estado: 'conforme', mp_1_recibida: '50' });
    expect(d.materias).toHaveLength(2);
    expect(d.materias[0].recibida).toBe('100');
  });

  it('paso 3: agrupa pesos peso_N', () => {
    const d = extract(3, { peso_0: '500', peso_1: '160' });
    expect(d.pesos).toHaveLength(2);
    expect(d.pesos[0].registrado).toBe('500');
  });

  it('paso 4: campos planos', () => {
    const d = extract(4, { temp_mezcla: '27', vel_baja: '20', vel_media: '50', hora_inicio: '08:00', temp_amasado: '30', homogeneidad: 'ok' });
    expect(d.temp_mezcla).toBe('27');
    expect(d.homogeneidad).toBe('ok');
  });

  it('paso 5: agrupa controles control_N_valor', () => {
    const d = extract(5, { control_0_valor: '5.0', control_1_valor: '6.0' });
    expect(d.controles).toHaveLength(2);
    expect(d.controles[0].valor).toBe('5.0');
  });

  it('paso 6: campos administrativos', () => {
    const d = extract(6, { cant_obtenida: '950', hora_retiro: '10:00', destino: 'X', condicion: 'ok' });
    expect(d.cant_obtenida).toBe('950');
    expect(d.destino).toBe('X');
  });

  it('paso 7: empaque', () => {
    const d = extract(7, { tipo_envase: 'F', lote_envases: 'E1', lote_etiquetas: 'L1', unidades_empacadas: '900', unidades_descartadas: '5', hora_inicio_emp: '11:00', hora_fin_emp: '12:00' });
    expect(d.tipo_envase).toBe('F');
    expect(d.unidades_empacadas).toBe('900');
  });

  it('paso 8: acondicionamiento', () => {
    const d = extract(8, { hora_ingreso: '13:00', codigo_area: 'A1', temp_area: '20', humedad_area: '50', condicion_area: 'ok' });
    expect(d.codigo_area).toBe('A1');
  });

  it('paso 9: etiquetado', () => {
    const d = extract(9, { unidades_etiquetadas: '900', numero_lote_etq: 'FT-X', fecha_fab: '2026-01-01', fecha_venc: '2028-01-01', nombre_producto_etq: 'P', registro_sanitario: 'INVIMA' });
    expect(d.unidades_etiquetadas).toBe('900');
    expect(d.registro_sanitario).toBe('INVIMA');
  });

  it('body undefined no revienta', () => {
    expect(() => extract(1, undefined)).not.toThrow();
  });

  it('checkbox con valor "on" se interpreta como true', () => {
    const d = extract(1, { chk_x: 'on' });
    expect(d.chk_x).toBe(true);
  });
});

describe('validarPasoCompleto', () => {
  it('paso 1: con todos los checks → ok', () => {
    const datos = extract(1, {
      chk_orden_recibida: '1', chk_datos_coinciden: '1',
      chk_responsable: '1', chk_observaciones: '1',
    });
    const r = validar(1, datos, {});
    expect(r.ok).toBe(true);
  });

  it('paso 1: falta un check → falla', () => {
    const datos = extract(1, { chk_orden_recibida: '1' });
    const r = validar(1, datos, {});
    expect(r.ok).toBe(false);
    expect(r.errores.length).toBeGreaterThan(0);
  });

  it('paso 2: requiere recibida, estado y los 4 checks', () => {
    const ok = extract(2, {
      mp_0_recibida: '100', mp_0_estado: 'conforme',
      chk_mp_laboratorio: '1', chk_transporte: '1',
      chk_embalajes: '1', chk_temperatura: '1',
    });
    expect(validar(2, ok, {}).ok).toBe(true);

    const sinRecibida = extract(2, {
      mp_0_recibida: '', mp_0_estado: 'conforme',
      chk_mp_laboratorio: '1', chk_transporte: '1',
      chk_embalajes: '1', chk_temperatura: '1',
    });
    expect(validar(2, sinRecibida, {}).ok).toBe(false);
  });

  it('paso 2: array materias vacío → falla', () => {
    const r = validar(2, { materias: [] }, {});
    expect(r.ok).toBe(false);
  });

  it('paso 3: requiere peso registrado y checks', () => {
    const ok = extract(3, {
      peso_0: '500',
      chk_balanza: '1', chk_pesos_reg: '1',
      chk_bpm: '1', chk_area_limpia: '1',
    });
    expect(validar(3, ok, {}).ok).toBe(true);
  });

  it('paso 3: pesos vacíos → falla', () => {
    expect(validar(3, { pesos: [] }, {}).ok).toBe(false);
  });

  it('paso 4: campos + checks', () => {
    const body = { temp_mezcla: '27', vel_baja: '20', vel_media: '50', hora_inicio: '08:00', temp_amasado: '30', homogeneidad: 'ok',
      chk_mezclador: '1', chk_temp_ok: '1', chk_pasos_seguidos: '1', chk_homogeneidad: '1' };
    expect(validar(4, extract(4, body), body).ok).toBe(true);

    const malo = { ...body, temp_mezcla: '' };
    expect(validar(4, extract(4, malo), malo).ok).toBe(false);
  });

  it('paso 5: controles + checks', () => {
    const body = { control_0_valor: '5.0', control_1_valor: '6.0',
      chk_controles: '1', chk_lab: '1', chk_dentro_espec: '1', chk_desviaciones: '1' };
    expect(validar(5, extract(5, body), body).ok).toBe(true);
    expect(validar(5, { controles: [] }, {}).ok).toBe(false);
  });

  it('paso 6: 4 campos + 4 checks', () => {
    const body = { cant_obtenida: '950', hora_retiro: '10:00', destino: 'X', condicion: 'ok',
      chk_producto_retirado: '1', chk_cantidad: '1', chk_hora: '1', chk_destino: '1' };
    expect(validar(6, extract(6, body), body).ok).toBe(true);
    const malo = { ...body, destino: '' };
    expect(validar(6, extract(6, malo), malo).ok).toBe(false);
  });

  it('paso 7: empaque completo', () => {
    const body = { tipo_envase: 'F', lote_envases: 'E', lote_etiquetas: 'L', unidades_empacadas: '900', unidades_descartadas: '5', hora_inicio_emp: '11:00', hora_fin_emp: '12:00',
      chk_envase_reg: '1', chk_unidades_reg: '1', chk_control_linea: '1', chk_horas_anotadas: '1' };
    expect(validar(7, extract(7, body), body).ok).toBe(true);
  });

  it('paso 8: acondicionamiento completo', () => {
    const body = { hora_ingreso: '13:00', codigo_area: 'A1', temp_area: '20', humedad_area: '50', condicion_area: 'ok',
      chk_hora_ingreso: '1', chk_temp_bpm: '1', chk_hum_bpm: '1', chk_area_habilitada: '1' };
    expect(validar(8, extract(8, body), body).ok).toBe(true);
  });

  it('paso 9: etiquetado completo (6 checks + 6 campos)', () => {
    const body = { unidades_etiquetadas: '900', numero_lote_etq: 'FT', fecha_fab: '2026', fecha_venc: '2028', nombre_producto_etq: 'P', registro_sanitario: 'INVIMA',
      chk_numero_lote: '1', chk_fecha_fab: '1', chk_fecha_venc: '1', chk_nombre: '1', chk_concentracion: '1', chk_registro: '1' };
    expect(validar(9, extract(9, body), body).ok).toBe(true);
    const malo = { ...body, chk_registro: '' };
    expect(validar(9, extract(9, malo), malo).ok).toBe(false);
  });
});
