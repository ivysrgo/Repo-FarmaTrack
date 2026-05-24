/**
 * src/data/formulas.js
 *
 * Catálogo INMUTABLE de fórmulas (recetas) de los medicamentos producidos.
 * Es código, no BD: el DT no edita esto desde la app. Los 5 productos del
 * seed están aquí; si en el futuro entra un producto nuevo, hay que añadirlo
 * acá y redeployar.
 *
 * Estructura por producto:
 *
 *   producto: clave EXACTA del campo lote.producto (ej. "Amoxicilina 500 mg")
 *
 *   paso2.materias[]  → Lista de MPs que entran al lote. Se renderiza como
 *                       tabla editable en views/operario/pasos/paso2.ejs.
 *                       espNum/espUnidad permiten validar la cantidad recibida
 *                       contra [min, max] expresados en la MISMA unidad.
 *
 *   paso3.pesos[]     → Pesos verificados en balanza. Mismo set que paso2,
 *                       pero el operario los re-pesa una a una.
 *
 *   paso4.parametros  → Diccionario de parámetros del instructivo de
 *                       manufactura. Cada uno con { min, max, unidad, nominal }.
 *                       Si no hay rango para un campo, se omite (el campo se
 *                       muestra sin validación).
 *
 *   paso5.controles[] → Controles de calidad. Cada uno con { nombre, min, max,
 *                       unidad }. Se renderiza como tabla en paso5.ejs.
 *
 * No incluye paso6/7/8/9: esos pasos tienen datos administrativos (horas,
 * códigos, cantidades de envase) que no dependen del producto.
 *
 * Helper exportado:
 *   getFormula(nombreProducto) → fórmula o null si no existe.
 *   validarValoresPaso(formula, paso, datos) → { ok, errores[] }
 */
'use strict';

const FORMULAS = {
  'Amoxicilina 500 mg': {
    paso2: {
      materias: [
        { codigo: 'MP-001', nombre: 'Amoxicilina trihidrato',   espNum: 2500, espUnidad: 'g', min: 2475, max: 2525 },
        { codigo: 'MP-002', nombre: 'Celulosa microcristalina', espNum:  800, espUnidad: 'g', min:  792, max:  808 },
        { codigo: 'MP-003', nombre: 'Almidón de maíz',          espNum:  400, espUnidad: 'g', min:  396, max:  404 },
        { codigo: 'MP-004', nombre: 'Estearato de magnesio',    espNum:   20, espUnidad: 'g', min:   19, max:   21 },
        { codigo: 'MP-005', nombre: 'Dióxido de silicio',       espNum:   15, espUnidad: 'g', min:   14, max:   16 },
      ],
    },
    paso4: {
      parametros: {
        temp_mezcla:  { min: 25, max: 30, unidad: '°C', nominal: 27 },
        temp_amasado: { min: 28, max: 32, unidad: '°C', nominal: 30 },
      },
    },
    paso5: {
      controles: [
        { codigo: 'pH',           nombre: 'pH del granulado',          min: 4.5, max: 6.0, unidad: ''   },
        { codigo: 'dureza',       nombre: 'Dureza promedio (cápsula)', min: 4.0, max: 8.0, unidad: 'kp' },
        { codigo: 'desintegr',    nombre: 'Tiempo de desintegración',  min: 10,  max: 30,  unidad: 'min' },
        { codigo: 'peso_unidad',  nombre: 'Peso por cápsula',          min: 590, max: 610, unidad: 'mg' },
      ],
    },
  },

  'Ibuprofeno 400 mg': {
    paso2: {
      materias: [
        { codigo: 'MP-IBU',      nombre: 'Ibuprofeno USP',             espNum: 4000, espUnidad: 'g', min: 3960, max: 4040 },
        { codigo: 'MP-002',      nombre: 'Celulosa microcristalina',   espNum: 1200, espUnidad: 'g', min: 1188, max: 1212 },
        { codigo: 'MP-007',      nombre: 'Povidona K30',               espNum:  150, espUnidad: 'g', min:  148, max:  152 },
        { codigo: 'MP-004',      nombre: 'Estearato de magnesio',      espNum:   25, espUnidad: 'g', min:   24, max:   26 },
        { codigo: 'MP-005',      nombre: 'Dióxido de silicio',         espNum:   20, espUnidad: 'g', min:   19, max:   21 },
      ],
    },
    paso4: {
      parametros: {
        temp_mezcla:  { min: 22, max: 28, unidad: '°C', nominal: 25 },
        temp_amasado: { min: 25, max: 30, unidad: '°C', nominal: 27 },
      },
    },
    paso5: {
      controles: [
        { codigo: 'pH',           nombre: 'pH del granulado',          min: 5.5, max: 7.0, unidad: ''   },
        { codigo: 'dureza',       nombre: 'Dureza promedio (tableta)', min: 5.0, max: 9.0, unidad: 'kp' },
        { codigo: 'friabilidad',  nombre: 'Friabilidad',               min: 0,   max: 1,   unidad: '%'  },
        { codigo: 'peso_unidad',  nombre: 'Peso por tableta',          min: 490, max: 510, unidad: 'mg' },
      ],
    },
  },

  'Metformina 850 mg': {
    paso2: {
      materias: [
        { codigo: 'MP-MET',      nombre: 'Metformina HCl',             espNum: 8500, espUnidad: 'g', min: 8415, max: 8585 },
        { codigo: 'MP-002',      nombre: 'Celulosa microcristalina',   espNum: 1500, espUnidad: 'g', min: 1485, max: 1515 },
        { codigo: 'MP-007',      nombre: 'Povidona K30',               espNum:  200, espUnidad: 'g', min:  198, max:  202 },
        { codigo: 'MP-004',      nombre: 'Estearato de magnesio',      espNum:   30, espUnidad: 'g', min:   29, max:   31 },
        { codigo: 'MP-005',      nombre: 'Dióxido de silicio',         espNum:   25, espUnidad: 'g', min:   24, max:   26 },
      ],
    },
    paso4: {
      parametros: {
        temp_mezcla:  { min: 20, max: 26, unidad: '°C', nominal: 23 },
        temp_amasado: { min: 25, max: 30, unidad: '°C', nominal: 27 },
      },
    },
    paso5: {
      controles: [
        { codigo: 'pH',           nombre: 'pH del granulado',          min: 6.0, max: 7.5, unidad: ''   },
        { codigo: 'dureza',       nombre: 'Dureza promedio (tableta)', min: 6.0, max: 10.0, unidad: 'kp' },
        { codigo: 'friabilidad',  nombre: 'Friabilidad',               min: 0,   max: 1,    unidad: '%'  },
        { codigo: 'peso_unidad',  nombre: 'Peso por tableta',          min: 840, max: 860,  unidad: 'mg' },
      ],
    },
  },

  'Loratadina 10 mg': {
    paso2: {
      materias: [
        { codigo: 'MP-LOR',      nombre: 'Loratadina USP',             espNum:  100, espUnidad: 'g', min:   99, max:  101 },
        { codigo: 'MP-006',      nombre: 'Lactosa monohidrato',        espNum: 3500, espUnidad: 'g', min: 3465, max: 3535 },
        { codigo: 'MP-002',      nombre: 'Celulosa microcristalina',   espNum:  500, espUnidad: 'g', min:  495, max:  505 },
        { codigo: 'MP-007',      nombre: 'Povidona K30',               espNum:   80, espUnidad: 'g', min:   79, max:   81 },
        { codigo: 'MP-004',      nombre: 'Estearato de magnesio',      espNum:   15, espUnidad: 'g', min:   14, max:   16 },
      ],
    },
    paso4: {
      parametros: {
        temp_mezcla:  { min: 20, max: 25, unidad: '°C', nominal: 22 },
        temp_amasado: { min: 22, max: 27, unidad: '°C', nominal: 25 },
      },
    },
    paso5: {
      controles: [
        { codigo: 'pH',           nombre: 'pH del granulado',          min: 5.0, max: 6.5, unidad: ''   },
        { codigo: 'dureza',       nombre: 'Dureza promedio (tableta)', min: 3.0, max: 6.0, unidad: 'kp' },
        { codigo: 'friabilidad',  nombre: 'Friabilidad',               min: 0,   max: 1,   unidad: '%'  },
        { codigo: 'peso_unidad',  nombre: 'Peso por tableta',          min: 195, max: 205, unidad: 'mg' },
      ],
    },
  },

  'Enalapril 10 mg': {
    paso2: {
      materias: [
        { codigo: 'MP-ENA',      nombre: 'Enalapril maleato',          espNum:  100, espUnidad: 'g', min:   99, max:  101 },
        { codigo: 'MP-006',      nombre: 'Lactosa monohidrato',        espNum: 1800, espUnidad: 'g', min: 1782, max: 1818 },
        { codigo: 'MP-002',      nombre: 'Celulosa microcristalina',   espNum:  400, espUnidad: 'g', min:  396, max:  404 },
        { codigo: 'MP-007',      nombre: 'Povidona K30',               espNum:   60, espUnidad: 'g', min:   59, max:   61 },
        { codigo: 'MP-004',      nombre: 'Estearato de magnesio',      espNum:   12, espUnidad: 'g', min:   11, max:   13 },
      ],
    },
    paso4: {
      parametros: {
        temp_mezcla:  { min: 18, max: 24, unidad: '°C', nominal: 21 },
        temp_amasado: { min: 22, max: 28, unidad: '°C', nominal: 25 },
      },
    },
    paso5: {
      controles: [
        { codigo: 'pH',           nombre: 'pH del granulado',          min: 5.5, max: 7.0, unidad: ''   },
        { codigo: 'dureza',       nombre: 'Dureza promedio (tableta)', min: 3.0, max: 6.0, unidad: 'kp' },
        { codigo: 'friabilidad',  nombre: 'Friabilidad',               min: 0,   max: 1,   unidad: '%'  },
        { codigo: 'peso_unidad',  nombre: 'Peso por tableta',          min: 145, max: 155, unidad: 'mg' },
      ],
    },
  },
};

/**
 * Busca la fórmula de un producto por nombre exacto o por coincidencia
 * insensible a mayúsculas/espacios extra. Devuelve null si no existe
 * (la vista debe manejar el caso "producto sin fórmula").
 */
function getFormula(nombreProducto) {
  if (!nombreProducto) return null;
  if (FORMULAS[nombreProducto]) return FORMULAS[nombreProducto];
  const norm = nombreProducto.toLowerCase().replace(/\s+/g, ' ').trim();
  for (const key of Object.keys(FORMULAS)) {
    if (key.toLowerCase().replace(/\s+/g, ' ').trim() === norm) return FORMULAS[key];
  }
  return null;
}

/** Devuelve los productos con fórmula. Útil para el dropdown de "Producto" del form de nuevo lote. */
function listarProductos() {
  return Object.keys(FORMULAS);
}

/**
 * Valida los datos de un paso contra la fórmula. Devuelve { ok, errores[] }.
 *
 * errores[] tiene objetos { campo, valor, min, max, unidad, mensaje }.
 * El controller usa esto para bloquear el guardado si algún valor cayó fuera
 * del rango BPM y mandar al operario a reportar una NC.
 *
 * Solo valida los campos numéricos que la fórmula declara con min/max.
 * Si el operario dejó el campo vacío, no se valida (no hay valor para juzgar).
 * Si la fórmula no tiene definición para ese paso, retorna { ok:true } sin
 * validar nada.
 */
function validarValoresPaso(formula, paso, datos) {
  if (!formula) return { ok: true, errores: [] };
  const errores = [];
  const reg = (campo, valor, def) => {
    if (valor === '' || valor === undefined || valor === null) return; // vacío = no validar
    const num = parseFloat(String(valor).replace(',', '.'));
    if (Number.isNaN(num)) return; // no numérico, no podemos validar rango
    if (num < def.min || num > def.max) {
      errores.push({
        campo, valor: num, min: def.min, max: def.max, unidad: def.unidad || '',
        mensaje: `${campo}: ${num} ${def.unidad || ''} fuera del rango BPM (${def.min}–${def.max} ${def.unidad || ''})`,
      });
    }
  };

  if (paso === 2 && formula.paso2 && Array.isArray(formula.paso2.materias) && Array.isArray(datos.materias)) {
    formula.paso2.materias.forEach((m, i) => {
      const item = datos.materias[i];
      if (!item) return;
      reg(`MP "${m.nombre}"`, item.recibida, { min: m.min, max: m.max, unidad: m.espUnidad });
    });
  }
  if (paso === 3 && formula.paso2 && Array.isArray(formula.paso2.materias) && Array.isArray(datos.pesos)) {
    // Reutilizamos los rangos de paso2 (pesos teóricos son los mismos).
    formula.paso2.materias.forEach((m, i) => {
      const item = datos.pesos[i];
      if (!item) return;
      reg(`Peso "${m.nombre}"`, item.registrado, { min: m.min, max: m.max, unidad: m.espUnidad });
    });
  }
  if (paso === 4 && formula.paso4 && formula.paso4.parametros) {
    const p = formula.paso4.parametros;
    if (p.temp_mezcla)  reg('Temperatura de mezcla',  datos.temp_mezcla,  p.temp_mezcla);
    if (p.temp_amasado) reg('Temperatura de amasado', datos.temp_amasado, p.temp_amasado);
  }
  if (paso === 5 && formula.paso5 && Array.isArray(formula.paso5.controles) && Array.isArray(datos.controles)) {
    formula.paso5.controles.forEach((c, i) => {
      const item = datos.controles[i];
      if (!item) return;
      reg(c.nombre, item.valor, { min: c.min, max: c.max, unidad: c.unidad });
    });
  }

  return { ok: errores.length === 0, errores };
}

module.exports = { FORMULAS, getFormula, listarProductos, validarValoresPaso };
