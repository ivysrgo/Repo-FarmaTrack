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
    '!src/repositories/LoteRepositoryMongo.js',
    '!src/repositories/UsuarioRepositoryMongo.js',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'html'],
  testPathIgnorePatterns: ['/node_modules/'],
};
