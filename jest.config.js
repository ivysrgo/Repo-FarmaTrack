'use strict';

module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/jest.setup.js'],
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/app.js',
    '!src/config/mongo.js',
    '!src/routes/**',
    '!src/middlewares/**',
    '!src/models/**',
    // Los repos Mongo se cubren con integration tests con BD real (no aplican
    // aquí). Excluirlos evita contar 0% sobre código que requiere Atlas.
    '!src/repositories/**Mongo.js',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'html'],
  testPathIgnorePatterns: ['/node_modules/'],
};
