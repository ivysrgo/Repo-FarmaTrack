/**
 * scripts/seed.js
 *
 * Script de siembra para FarmaTrack. Pobla MongoDB Atlas con:
 *   - 3 usuarios demo (1 DT, 2 operarios)
 *   - 6 lotes con variedad de estados para que el panel y los dashboards
 *     muestren datos en cada filtro/columna.
 *
 * Estrategia: idempotente con --reset.
 *   - Por defecto NO borra nada. Solo inserta documentos faltantes
 *     (chequea por email/numeroLote unicos). Sirve para "asegurar" que la
 *     base tiene la data demo sin destruir lo que el usuario haya creado.
 *   - Con --reset borra TODO antes de insertar (util para empezar fresh
 *     durante desarrollo).
 *
 * Uso:
 *   npm run seed              -> idempotente
 *   npm run seed -- --reset   -> borra y reseedea
 */
'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const { connectMongo, disconnectMongo } = require('../src/config/mongo');
const Lote         = require('../src/models/Lote');
const Usuario      = require('../src/models/Usuario');
const MateriaPrima = require('../src/models/MateriaPrima');

// ── Datos demo ──────────────────────────────────────────────────

const USUARIOS_DEMO = [
  {
    nombre:   'Juan Bahos',
    email:    'juan.bahos@farmatrack.co',
    password: '1234',
    rol:      'director_tecnico',
    cargo:    'Director Tecnico',
    activo:   true,
  },
  {
    nombre:   'Sergio Velandia',
    email:    'sergio.velandia@farmatrack.co',
    password: '1234',
    rol:      'operario',
    cargo:    'Operario de Produccion',
    activo:   true,
  },
  {
    nombre:   'David Pena',
    email:    'david.pena@farmatrack.co',
    password: '1234',
    rol:      'operario',
    cargo:    'Operario de Produccion',
    activo:   true,
  },
];

// 5 lotes - uno por cada producto con fórmula maestra registrada.
// Todos arrancan en paso 1, en_espera, sin alertas. Dashboard limpio para
// demo: el flujo se ejecuta de cero cuando el operario empieza a trabajar.
const LOTES_DEMO = [
  {
    numeroOrden: 'OP-2026-041', numeroLote: 'FT-2026-0041',
    producto: 'Amoxicilina 500 mg', formulaId: 'Amoxicilina 500 mg',
    formaFarmaceutica: 'Capsulas', concentracion: '500 mg',
    cantidadPlanificada: 50000,
    fechaInicio: new Date('2026-04-20T06:00:00'),
    estado: 'en_espera', pasoActual: 1,
    operario: 'Sergio Velandia', jefeCalidad: 'Patricia Henao',
    directorTecnico: 'Juan Bahos', area: 'Solidos - Linea 2',
    observaciones: 'Orden creada. Pendiente arranque.',
    tiempoTranscurrido: '0m',
  },
  {
    numeroOrden: 'OP-2026-042', numeroLote: 'FT-2026-0042',
    producto: 'Ibuprofeno 400 mg', formulaId: 'Ibuprofeno 400 mg',
    formaFarmaceutica: 'Tabletas', concentracion: '400 mg',
    cantidadPlanificada: 80000,
    fechaInicio: new Date('2026-04-20T07:30:00'),
    estado: 'en_espera', pasoActual: 1,
    operario: 'David Pena', jefeCalidad: 'Patricia Henao',
    directorTecnico: 'Juan Bahos', area: 'Solidos - Linea 1',
    observaciones: 'Orden creada. Pendiente arranque.',
    tiempoTranscurrido: '0m',
  },
  {
    numeroOrden: 'OP-2026-043', numeroLote: 'FT-2026-0043',
    producto: 'Metformina 850 mg', formulaId: 'Metformina 850 mg',
    formaFarmaceutica: 'Tabletas', concentracion: '850 mg',
    cantidadPlanificada: 120000,
    fechaInicio: new Date('2026-04-20T06:00:00'),
    estado: 'en_espera', pasoActual: 1,
    operario: 'Sergio Velandia', jefeCalidad: 'Roberto Vega',
    directorTecnico: 'Juan Bahos', area: 'Solidos - Linea 2',
    observaciones: 'Orden creada. Pendiente arranque.',
    tiempoTranscurrido: '0m',
  },
  {
    numeroOrden: 'OP-2026-044', numeroLote: 'FT-2026-0044',
    producto: 'Loratadina 10 mg', formulaId: 'Loratadina 10 mg',
    formaFarmaceutica: 'Tabletas', concentracion: '10 mg',
    cantidadPlanificada: 60000,
    fechaInicio: new Date('2026-04-20T08:00:00'),
    estado: 'en_espera', pasoActual: 1,
    operario: 'David Pena', jefeCalidad: 'Sofia Restrepo',
    directorTecnico: 'Juan Bahos', area: 'Solidos - Linea 1',
    observaciones: 'Orden creada. Pendiente arranque.',
    tiempoTranscurrido: '0m',
  },
  {
    numeroOrden: 'OP-2026-045', numeroLote: 'FT-2026-0045',
    producto: 'Enalapril 10 mg', formulaId: 'Enalapril 10 mg',
    formaFarmaceutica: 'Tabletas', concentracion: '10 mg',
    cantidadPlanificada: 45000,
    fechaInicio: new Date('2026-04-20T09:00:00'),
    estado: 'en_espera', pasoActual: 1,
    operario: 'Sergio Velandia', jefeCalidad: 'Roberto Vega',
    directorTecnico: 'Juan Bahos', area: 'Solidos - Linea 2',
    observaciones: 'Orden creada. Pendiente arranque.',
    tiempoTranscurrido: '0m',
  },
];

// 7 materias primas — antes estaban hardcodeadas en SidebarController.
const MATERIAS_PRIMAS_DEMO = [
  { codigo: 'MP-001', nombre: 'Amoxicilina trihidrato',   stockKg: 145.2, stockMinKg: 50, proveedor: 'Quimifarma S.A.' },
  { codigo: 'MP-002', nombre: 'Celulosa microcristalina', stockKg: 320.0, stockMinKg: 80, proveedor: 'Excipientes Andes' },
  { codigo: 'MP-003', nombre: 'Almidon de maiz',          stockKg: 18.5,  stockMinKg: 30, proveedor: 'Granos Industrial' },
  { codigo: 'MP-004', nombre: 'Estearato de magnesio',    stockKg: 12.0,  stockMinKg: 5,  proveedor: 'Excipientes Andes' },
  { codigo: 'MP-005', nombre: 'Dioxido de silicio',       stockKg: 8.3,   stockMinKg: 5,  proveedor: 'Quimifarma S.A.' },
  { codigo: 'MP-006', nombre: 'Lactosa monohidrato',      stockKg: 0,     stockMinKg: 40, proveedor: 'Granos Industrial' },
  { codigo: 'MP-007', nombre: 'Povidona K30',             stockKg: 22.5,  stockMinKg: 10, proveedor: 'Excipientes Andes' },
];

// ── Logica del seed ──────────────────────────────────────────────

async function seedUsuarios(reset) {
  if (reset) {
    const r = await Usuario.deleteMany({});
    console.log(`[seed] usuarios borrados: ${r.deletedCount}`);
  }
  let creados = 0, existentes = 0;
  for (const u of USUARIOS_DEMO) {
    const ya = await Usuario.findOne({ email: u.email });
    if (ya) { existentes++; continue; }
    await Usuario.create(u);
    creados++;
  }
  console.log(`[seed] usuarios -> creados: ${creados}, ya existian: ${existentes}`);
}

async function seedLotes(reset) {
  if (reset) {
    const r = await Lote.deleteMany({});
    console.log(`[seed] lotes borrados: ${r.deletedCount}`);
  }
  let creados = 0, existentes = 0;
  for (const l of LOTES_DEMO) {
    const ya = await Lote.findOne({ numeroLote: l.numeroLote });
    if (ya) { existentes++; continue; }
    await Lote.create(l);
    creados++;
  }
  console.log(`[seed] lotes -> creados: ${creados}, ya existian: ${existentes}`);
}

async function seedMateriasPrimas(reset) {
  if (reset) {
    const r = await MateriaPrima.deleteMany({});
    console.log(`[seed] materias primas borradas: ${r.deletedCount}`);
  }
  let creadas = 0, existentes = 0;
  for (const m of MATERIAS_PRIMAS_DEMO) {
    const ya = await MateriaPrima.findOne({ codigo: m.codigo });
    if (ya) { existentes++; continue; }
    await MateriaPrima.create(m);
    creadas++;
  }
  console.log(`[seed] materias primas -> creadas: ${creadas}, ya existian: ${existentes}`);
}

async function main() {
  const reset = process.argv.includes('--reset');

  console.log('[seed] Conectando a Mongo...');
  const conn = await connectMongo();
  if (!conn) {
    console.error('[seed] No hay MONGO_URI definida. Abortando.');
    process.exit(1);
  }

  if (reset) console.log('[seed] Modo --reset: se borrara toda la data antes de sembrar.');

  try {
    await seedUsuarios(reset);
    await seedLotes(reset);
    await seedMateriasPrimas(reset);

    const stats = {
      usuarios:        await Usuario.countDocuments({}),
      lotes:           await Lote.countDocuments({}),
      materias_primas: await MateriaPrima.countDocuments({}),
      porEstado: {},
    };
    for (const estado of ['en_espera','en_produccion','pendiente_firma','en_calidad','alerta_bpm','liberado']) {
      stats.porEstado[estado] = await Lote.countDocuments({ estado });
    }

    console.log('\n[seed] OK - resumen:');
    console.log(JSON.stringify(stats, null, 2));
  } catch (err) {
    console.error('[seed] ERROR:', err.message);
    process.exitCode = 1;
  } finally {
    await disconnectMongo();
    console.log('[seed] Conexion cerrada. Fin.');
  }
}

main();
