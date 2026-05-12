/**
 * src/repositories/LoteRepository.js
 *
 * Repositorio de Lotes — fuente única de verdad.
 *
 * PROPÓSITO
 *  - Abstrae el acceso a datos de la entidad Lote / OrdenDeProducción.
 *  - PanelController y LoteController consumen esta interfaz; ninguno guarda
 *    datos por su cuenta. Así, cuando un Lote se crea desde el formulario de
 *    nueva orden, aparece automáticamente en el panel del DT.
 *
 * IMPLEMENTACIÓN
 *  - Por ahora persiste en memoria (Array). La interfaz pública (findAll,
 *    findById, create, update) es la misma que usaremos contra MongoDB.
 *  - Para migrar la próxima semana basta con crear `LoteRepositoryMongo` con
 *    los mismos métodos y exportar esa instancia. Cero cambios en controllers.
 *
 * MODELO
 *  Cada lote tiene la forma:
 *  {
 *    id, numeroOrden, numeroLote, producto, formaFarmaceutica, concentracion,
 *    cantidadPlanificada, fechaInicio, fechaFin,
 *    estado, estadoLabel, pasoActual,
 *    operario, operarioIniciales, jefeCalidad, directorTecnico, area,
 *    observaciones, tiempoTranscurrido, createdAt
 *  }
 */
'use strict';

// ── Catálogo de estados ─────────────────────────────────────────
const ESTADOS = {
  en_espera:       { slug: 'en_espera',       label: 'En espera' },
  en_produccion:   { slug: 'en_produccion',   label: 'En producción' },
  pendiente_firma: { slug: 'pendiente_firma', label: 'Pendiente verif.' },
  en_calidad:      { slug: 'en_calidad',      label: 'En calidad' },
  alerta_bpm:      { slug: 'alerta_bpm',      label: 'Alerta BPM' },
  bloqueado:       { slug: 'bloqueado',       label: 'Bloqueado' },
  liberado:        { slug: 'liberado',        label: 'Liberado' },
  rechazado:       { slug: 'rechazado',       label: 'Rechazado' },
};

function labelFor(estado) {
  return (ESTADOS[estado] && ESTADOS[estado].label) || estado;
}

// ── Helpers ─────────────────────────────────────────────────────
function iniciales(nombreCompleto) {
  if (!nombreCompleto) return '';
  return nombreCompleto.split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

class LoteRepository {
  constructor() {
    this._lotes   = [];
    this._nextId  = 1;
    this._nextSeq = 1;
    this._seedDemo();
  }

  /* ── Datos de demostración (mientras no haya Mongo) ───────── */
  _seedDemo() {
    const demo = [
      {
        numeroOrden: 'OP-2026-041', numeroLote: 'FT-2026-0041',
        producto: 'Amoxicilina 500 mg',  formaFarmaceutica: 'Cápsulas',
        concentracion: '500 mg',
        cantidadPlanificada: 50000,
        fechaInicio: '2026-04-17T06:00:00', fechaFin: '2026-04-19T18:00:00',
        estado: 'en_produccion', pasoActual: 5,
        operario: 'Carlos Rodríguez', jefeCalidad: 'Patricia Henao',
        directorTecnico: 'David Peña', area: 'Sólidos — Línea 2',
        observaciones: 'Sin observaciones adicionales.',
        tiempoTranscurrido: '2h 15m',
      },
      {
        numeroOrden: 'OP-2026-042', numeroLote: 'FT-2026-0042',
        producto: 'Ibuprofeno 400 mg', formaFarmaceutica: 'Tabletas',
        concentracion: '400 mg',
        cantidadPlanificada: 80000,
        fechaInicio: '2026-04-17T07:30:00',
        estado: 'pendiente_firma', pasoActual: 3,
        operario: 'Luisa Martínez', jefeCalidad: 'Patricia Henao',
        directorTecnico: 'David Peña', area: 'Sólidos — Línea 1',
        observaciones: 'Pendiente verificación de pesos por DT.',
        tiempoTranscurrido: '4h 30m',
      },
      {
        numeroOrden: 'OP-2026-043', numeroLote: 'FT-2026-0043',
        producto: 'Metformina 850 mg', formaFarmaceutica: 'Tabletas',
        concentracion: '850 mg',
        cantidadPlanificada: 120000,
        fechaInicio: '2026-04-18T06:00:00',
        estado: 'en_calidad', pasoActual: 7,
        operario: 'Andrés Gómez', jefeCalidad: 'Roberto Vega',
        directorTecnico: 'David Peña', area: 'Sólidos — Línea 2',
        observaciones: 'Controles de calidad en curso.',
        tiempoTranscurrido: '6h 50m',
      },
      {
        numeroOrden: 'OP-2026-040', numeroLote: 'FT-2026-0040',
        producto: 'Loratadina 10 mg', formaFarmaceutica: 'Tabletas',
        concentracion: '10 mg',
        cantidadPlanificada: 60000,
        fechaInicio: '2026-04-16T06:00:00',
        estado: 'liberado', pasoActual: 9,
        operario: 'María Torres', jefeCalidad: 'Sofía Restrepo',
        directorTecnico: 'David Peña', area: 'Sólidos — Línea 1',
        observaciones: 'Lote liberado. Batch record completo.',
        tiempoTranscurrido: '8h 00m',
      },
      {
        numeroOrden: 'OP-2026-044', numeroLote: 'FT-2026-0044',
        producto: 'Enalapril 10 mg', formaFarmaceutica: 'Tabletas',
        concentracion: '10 mg',
        cantidadPlanificada: 45000,
        fechaInicio: '2026-04-19T00:00:00',
        estado: 'alerta_bpm', pasoActual: 1,
        operario: 'Felipe Díaz', jefeCalidad: 'Roberto Vega',
        directorTecnico: 'David Peña', area: 'Sólidos — Línea 2',
        observaciones: 'Desviación BPM detectada en temperatura.',
        tiempoTranscurrido: '1h 10m',
      },
    ];

    demo.forEach(d => this._insert(d, /* updateSeq */ false));
    // Continuar la secuencia desde donde dejaron los demos
    this._nextSeq = 45;
  }

  _insert(data, updateSeq = true) {
    const id        = this._nextId++;
    const estado    = data.estado || 'en_espera';
    const lote = {
      id,
      numeroOrden:         data.numeroOrden || '',
      numeroLote:          data.numeroLote  || this.generateNumeroLote(),
      producto:            data.producto || data.medicamento || '',
      // alias para vistas legacy del stepper que aún leen lote.medicamento
      medicamento:         data.producto || data.medicamento || '',
      formaFarmaceutica:   data.formaFarmaceutica || '',
      concentracion:       data.concentracion || '',
      cantidadPlanificada: parseInt(data.cantidadPlanificada, 10) || 0,
      fechaInicio:         data.fechaInicio || new Date().toISOString(),
      fechaFin:            data.fechaFin || null,
      estado,
      estadoLabel:         labelFor(estado),
      pasoActual:          parseInt(data.pasoActual, 10) || 1,
      operario:            data.operario || '',
      operarioIniciales:   iniciales(data.operario || ''),
      operarioInicial:     iniciales(data.operario || ''), // alias legacy
      jefeCalidad:         data.jefeCalidad || '',
      directorTecnico:     data.directorTecnico || 'Director Técnico',
      area:                data.area || '',
      observaciones:       data.observaciones || '',
      tiempoTranscurrido:  data.tiempoTranscurrido || '0m',
      createdAt:           data.createdAt || new Date().toISOString(),
    };
    this._lotes.push(lote);
    if (updateSeq) this._nextSeq++;
    return lote;
  }

  /* ── Generadores ──────────────────────────────────────────── */
  generateNumeroLote() {
    const year = new Date().getFullYear();
    const seq  = String(this._nextSeq).padStart(4, '0');
    return `FT-${year}-${seq}`;
  }

  /* ── Queries ──────────────────────────────────────────────── */
  /**
   * Devuelve todos los lotes, opcionalmente filtrados.
   * @param {{ estado?: string, q?: string }} filtros
   */
  findAll(filtros = {}) {
    let res = [...this._lotes];
    if (filtros.estado) {
      res = res.filter(l => l.estado === filtros.estado);
    }
    if (filtros.q) {
      const q = filtros.q.toLowerCase();
      res = res.filter(l =>
        (l.numeroLote   || '').toLowerCase().includes(q) ||
        (l.numeroOrden  || '').toLowerCase().includes(q) ||
        (l.producto     || '').toLowerCase().includes(q) ||
        (l.operario     || '').toLowerCase().includes(q)
      );
    }
    return res;
  }

  /** Devuelve un lote por su id numérico, o null si no existe. */
  findById(id) {
    const numId = parseInt(id, 10);
    if (Number.isNaN(numId)) return null;
    return this._lotes.find(l => l.id === numId) || null;
  }

  /** Crea un nuevo lote y lo devuelve. */
  create(data) {
    const lote = this._insert(data, /* updateSeq */ true);
    console.log(`[LoteRepository] Lote creado: ${lote.numeroLote} (id=${lote.id}) — ${lote.producto}`);
    return lote;
  }

  /** Actualiza campos parciales de un lote. */
  update(id, partial) {
    const lote = this.findById(id);
    if (!lote) return null;
    Object.assign(lote, partial);
    if (partial.estado) lote.estadoLabel = labelFor(partial.estado);
    if (partial.producto) lote.medicamento = partial.producto;
    if (partial.operario) {
      lote.operarioIniciales = iniciales(partial.operario);
      lote.operarioInicial   = lote.operarioIniciales;
    }
    return lote;
  }

  /** Conteos rápidos para los KPIs del panel. */
  stats() {
    const all = this._lotes;
    return {
      total:           all.length,
      enProduccion:    all.filter(l => l.estado === 'en_produccion').length,
      pendientesFirma: all.filter(l => l.estado === 'pendiente_firma').length,
      alertasBPM:      all.filter(l => l.estado === 'alerta_bpm').length,
      enCalidad:       all.filter(l => l.estado === 'en_calidad').length,
      liberados:       all.filter(l => l.estado === 'liberado').length,
      bloqueados:      all.filter(l => l.estado === 'bloqueado').length,
    };
  }
}

// Singleton — toda la app comparte la misma instancia, así los lotes creados
// desde /lotes/nuevo aparecen en /panel sin ningún paso extra.
const instance = new LoteRepository();
module.exports = instance;
module.exports.LoteRepository = LoteRepository; // exportamos también la clase para tests
module.exports.ESTADOS = ESTADOS;
module.exports.labelFor = labelFor;
