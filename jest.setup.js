/**
 * jest.setup.js
 *
 * Se ejecuta antes de cada test suite. Fuerza el modo "repos en memoria"
 * para que los tests no intenten conectarse a MongoDB Atlas. Tambien
 * silencia dotenv para que su mensaje publicitario no contamine los logs.
 */
'use strict';

process.env.USE_MEMORY_REPOS = 'true';
process.env.DOTENV_CONFIG_QUIET = 'true';
