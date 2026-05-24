/**
 * src/repositories/LoteRepository.js
 *
 * Repositorio en memoria de Lotes. Mantiene la MISMA INTERFAZ ASYNC que
 * LoteRepositoryMongo: cada metodo retorna una Promise. Asi los services
 * llaman `await repo.find()` sin importar cual implementacion este enchufada.
 *
 * Uso:
 *   - En tests: instanciar `new LoteRepository()` para tener seed fresca.
 *   - En produccion offline (sin MONGO_URI): la app usa la instancia singleton.
 *   - En produccion con Mongo: la app usa LoteRepositoryMongo en su lugar.
 */
'use strict';

const ESTADOS = {
  en_espera:       { slug: 'en_espera',       label: 'En espera' },
  en_produccion:   { slug: 'en_produccion',   label: 'En produccion' },
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

function iniciales(nombreCompleto) {
  if (!nombreCompleto) return '';
  return nombreCompleto.split(' ').filter(Boolean)
    .map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

class LoteRepository {
  constructor() {
    this._lotes   = [];
    this._nextId  = 1;
    this._nextSeq = 1;
    this._seedDemo();
  }

  _seedDemo() {
    // Seed memoria: variedad de estados para que los tests cubran el flujo
    // completo. Cada lote lleva formulaId apuntando a una fórmula registrada.
    // El seed Mongo (scripts/seed.js) es el que arranca limpio con 5 lotes
    // en paso 1 para el demo del usuario.
    const demo = [
      { numeroOrden: 'OP-2026-041', numeroLote: 'FT-2026-0041', producto: 'Amoxicilina 500 mg', formulaId: 'Amoxicilina 500 mg', formaFarmaceutica: 'Capsulas', concentracion: '500 mg', cantidadPlanificada: 50000, fechaInicio: '2026-04-17T06:00:00', fechaFin: '2026-04-19T18:00:00', estado: 'en_produccion', pasoActual: 5, operario: 'Carlos Rodriguez', jefeCalidad: 'Patricia Henao', directorTecnico: 'David Pena', area: 'Solidos - Linea 2', observaciones: 'Sin observaciones adicionales.', tiempoTranscurrido: '2h 15m' },
      { numeroOrden: 'OP-2026-042', numeroLote: 'FT-2026-0042', producto: 'Ibuprofeno 400 mg', formulaId: 'Ibuprofeno 400 mg', formaFarmaceutica: 'Tabletas', concentracion: '400 mg', cantidadPlanificada: 80000, fechaInicio: '2026-04-17T07:30:00', estado: 'pendiente_firma', pasoActual: 3, operario: 'Luisa Martinez', jefeCalidad: 'Patricia Henao', directorTecnico: 'David Pena', area: 'Solidos - Linea 1', observaciones: 'Pendiente verificacion de pesos por DT.', tiempoTranscurrido: '4h 30m' },
      { numeroOrden: 'OP-2026-043', numeroLote: 'FT-2026-0043', producto: 'Metformina 850 mg', formulaId: 'Metformina 850 mg', formaFarmaceutica: 'Tabletas', concentracion: '850 mg', cantidadPlanificada: 120000, fechaInicio: '2026-04-18T06:00:00', estado: 'en_calidad', pasoActual: 7, operario: 'Andres Gomez', jefeCalidad: 'Roberto Vega', directorTecnico: 'David Pena', area: 'Solidos - Linea 2', observaciones: 'Controles de calidad en curso.', tiempoTranscurrido: '6h 50m' },
      { numeroOrden: 'OP-2026-040', numeroLote: 'FT-2026-0040', producto: 'Loratadina 10 mg', formulaId: 'Loratadina 10 mg', formaFarmaceutica: 'Tabletas', concentracion: '10 mg', cantidadPlanificada: 60000, fechaInicio: '2026-04-16T06:00:00', estado: 'liberado', pasoActual: 9, operario: 'Maria Torres', jefeCalidad: 'Sofia Restrepo', directorTecnico: 'David Pena', area: 'Solidos - Linea 1', observaciones: 'Lote liberado. Batch record completo.', tiempoTranscurrido: '8h 00m' },
      { numeroOrden: 'OP-2026-044', numeroLote: 'FT-2026-0044', producto: 'Enalapril 10 mg', formulaId: 'Enalapril 10 mg', formaFarmaceutica: 'Tabletas', concentracion: '10 mg', cantidadPlanificada: 45000, fechaInicio: '2026-04-19T00:00:00', estado: 'alerta_bpm', pasoActual: 1, operario: 'Felipe Diaz', jefeCalidad: 'Roberto Vega', directorTecnico: 'David Pena', area: 'Solidos - Linea 2', observaciones: 'Desviacion BPM detectada en temperatura.', tiempoTranscurrido: '1h 10m' },
    ];
    demo.forEach(d => this._insert(d, false));
    this._nextSeq = 45;
  }

  _insert(data, updateSeq = true) {
    const id     = this._nextId++;
    const estado = data.estado || 'en_espera';
    const lote = {
      id,
      numeroOrden:         data.numeroOrden || '',
      numeroLote:          data.numeroLote  || this._buildNumero(),
      producto:            data.producto || data.medicamento || '',
      medicamento:         data.producto || data.medicamento || '',
      formulaId:           data.formulaId || '',
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
      operarioInicial:     iniciales(data.operario || ''),
      jefeCalidad:         data.jefeCalidad || '',
      directorTecnico:     data.directorTecnico || 'Director Tecnico',
      area:                data.area || '',
      observaciones:       data.observaciones || '',
      tiempoTranscurrido:  data.tiempoTranscurrido || '0m',
      pasos:               data.pasos || {},
      createdAt:           data.createdAt || new Date().toISOString(),
    };
    this._lotes.push(lote);
    if (updateSeq) this._nextSeq++;
    return lote;
  }

  _buildNumero() {
    const year = new Date().getFullYear();
    return `FT-${year}-${String(this._nextSeq).padStart(4, '0')}`;
  }

  // ── Interfaz publica async (espeja LoteRepositoryMongo) ────────

  async generateNumeroLote() {
    return this._buildNumero();
  }

  async findAll(filtros = {}) {
    let res = [...this._lotes];
    if (filtros.estado) res = res.filter(l => l.estado === filtros.estado);
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

  async findById(id) {
    const numId = parseInt(id, 10);
    if (Number.isNaN(numId)) return null;
    return this._lotes.find(l => l.id === numId) || null;
  }

  async create(data) {
    const lote = this._insert(data, true);
    console.log(`[LoteRepository] Lote creado: ${lote.numeroLote} (id=${lote.id}) - ${lote.producto}`);
    return lote;
  }

  async update(id, partial) {
    const lote = await this.findById(id);
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

  async stats() {
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

const instance = new LoteRepository();
module.exports = instance;
module.exports.LoteRepository = LoteRepository;
module.exports.ESTADOS = ESTADOS;
module.exports.labelFor = labelFor;
).length,
      liberados:       all.filter(l => l.estado === 'liberado').length,
      bloqueados:      all.filter(l => l.estado === 'bloqueado').length,
    };
  }
}

const instance = new LoteRepository();
module.exports = instance;
module.exports.LoteRepository = LoteRepository;
module.exports.ESTADOS = ESTADOS;
module.exports.labelFor = labelFor;
 instance;
module.exports.LoteRepository = LoteRepository;
module.exports.ESTADOS = ESTADOS;
module.exports.labelFor = labelFor;
