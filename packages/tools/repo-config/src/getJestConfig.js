/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

const config = require('./jest.config');

function getJestConfig(modulePath) {
  const modulePathParts = modulePath.split('/');
  const internalScope = modulePathParts[modulePathParts.length - 2];
  const packetName = modulePathParts[modulePathParts.length - 1];
  const coverageDirectory = `<rootDir>/../../../coverage/${internalScope}/${packetName}`;
  return {
    ...config,
    displayName: packetName,
    coverageDirectory: `${coverageDirectory}`,
    reporters: [
      'default',
      ['jest-junit', { outputDirectory: `${coverageDirectory}`, outputName: `test-results.xml` }],
      ['jest-slow-test-reporter', { numTests: 8, warnOnSlowerThan: 300, color: true }],
      ['jest-html-reporter', { outputPath: `${coverageDirectory}/report.html` }],
    ],
  };
}
module.exports = getJestConfig;
