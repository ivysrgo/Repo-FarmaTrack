/**
 * LoteController.js
 * Controlador del módulo Gestión de Lotes — FarmaTrack
 * RQF-06: Panel de lotes activos con estado y paso del stepper.
 */

// ── Datos de ejemplo (reemplazar por BD real) ──────────────────────────────
const LOTES_EJEMPLO = [
    {
        id: 1,
        numeroLote: 'FT-2026-0041',
        medicamento: 'Amoxicilina 500 mg Cáps.',
        cantidadPlanificada: 50000,
        operario: 'Carlos Rodríguez',
        operarioInicial: 'CR',
        estado: 'en_produccion',
        pasoActual: 5,
        fechaInicio: '2026-04-17T06:00:00',
    },
    {
        id: 2,
        numeroLote: 'FT-2026-0042',
        medicamento: 'Ibuprofeno 400 mg Tab.',
        cantidadPlanificada: 80000,
        operario: 'Luisa Martínez',
        operarioInicial: 'LM',
        estado: 'bloqueado',
        pasoActual: 3,
        fechaInicio: '2026-04-17T07:30:00',
    },
    {
        id: 3,
        numeroLote: 'FT-2026-0043',
        medicamento: 'Metformina 850 mg Tab.',
        cantidadPlanificada: 120000,
        operario: 'Andrés Gómez',
        operarioInicial: 'AG',
        estado: 'en_produccion',
        pasoActual: 2,
        fechaInicio: '2026-04-18T06:00:00',
    },
    {
        id: 4,
        numeroLote: 'FT-2026-0040',
        medicamento: 'Loratadina 10 mg Tab.',
        cantidadPlanificada: 60000,
        operario: 'María Torres',
        operarioInicial: 'MT',
        estado: 'liberado',
        pasoActual: 9,
        fechaInicio: '2026-04-16T06:00:00',
    },
    {
        id: 5,
        numeroLote: 'FT-2026-0044',
        medicamento: 'Enalapril 10 mg Tab.',
        cantidadPlanificada: 45000,
        operario: 'Felipe Díaz',
        operarioInicial: 'FD',
        estado: 'en_espera',
        pasoActual: 1,
        fechaInicio: '2026-04-19T00:00:00',
    },
];

/**
 * GET /lotes
 * Muestra el panel de lotes activos al Director Técnico (RQF-06).
 * Soporta filtrado por estado y búsqueda de texto (RQF-08).
 */
export function getLotesActivos(req, res) {
    const { q, estado } = req.query;

    let lotes = [...LOTES_EJEMPLO];

    // Filtro por texto libre (número de lote, medicamento, operario)
    if (q) {
        const busqueda = q.toLowerCase();
        lotes = lotes.filter(l =>
            l.numeroLote.toLowerCase().includes(busqueda) ||
            l.medicamento.toLowerCase().includes(busqueda) ||
            l.operario.toLowerCase().includes(busqueda)
        );
    }

    // Filtro por estado
    if (estado) {
        lotes = lotes.filter(l => l.estado === estado);
    }

    // Estadísticas del panel
    const todos = LOTES_EJEMPLO;
    const stats = {
        enProduccion: todos.filter(l => l.estado === 'en_produccion').length,
        bloqueados:   todos.filter(l => l.estado === 'bloqueado').length,
        liberadosHoy: todos.filter(l => l.estado === 'liberado').length,
        total:        todos.filter(l => l.estado !== 'rechazado').length,
    };

    res.render('lotes/index', {
        title: 'Lotes Activos',
        subtitle: 'Panel de supervisión — Módulo de Producción',
        currentPath: '/lotes',
        lotes,
        stats,
        query: q || '',
        estadoFiltro: estado || '',
    });
}
