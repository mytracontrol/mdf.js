/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 * Note: All information contained herein is, and remains the property of Mytra Control S.L. and its
 * suppliers, if any. The intellectual and technical concepts contained herein are property of
 * Mytra Control S.L. and its suppliers and may be covered by European and Foreign patents, patents
 * in process, and are protected by trade secret or copyright.
 *
 * Dissemination of this information or the reproduction of this material is strictly forbidden
 * unless prior written permission is obtained from Mytra Control S.L.
 */

module.exports = {
  moduleFileExtensions: ['ts', 'js', 'html'],
  testMatch: [`<rootDir>/src/**/*.test.ts`],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: `<rootDir>/tsconfig.spec.json`,
  }],
  },
  moduleNameMapper: {
    uuid: require.resolve('uuid'),
  },
  testEnvironmentOptions: {
    customExportConditions: ['node', 'require', 'default'],
  },
  passWithNoTests: false,
  forceExit: true,
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/test/*.ts',
    '!src/**/*.test.ts',
    '!src/**/index.ts'
  ],
  coverageReporters: ['clover', 'json', 'lcov', ['text', { skipFull: false }], 'cobertura'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
}
