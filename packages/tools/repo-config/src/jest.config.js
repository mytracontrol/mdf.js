/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

module.exports = {
  moduleFileExtensions: ['ts', 'js', 'html', 'json'],
  testMatch: [`<rootDir>/src/**/*.test.ts`],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: `<rootDir>/tsconfig.spec.json`,
      useESM: true,
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
    '!src/**/index.ts',
    '!src/**/*.t.ts',
    '!src/**/*.i.ts',
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
