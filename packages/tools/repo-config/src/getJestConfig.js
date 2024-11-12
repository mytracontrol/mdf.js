/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

const config = require('./jest.config');
const os = require('os');

function getJestConfig(modulePath) {
  // The split should be different depending on the OS, in case of Windows, it should be '\\' instead
  // of '/' for the linux based systems.
  const modulePathParts = modulePath.split(os.platform() === 'win32' ? '\\' : '/');
  const internalScope = modulePathParts[modulePathParts.length - 2];
  const packetName = modulePathParts[modulePathParts.length - 1];
  const coverageDirectory = `../../../coverage/${internalScope}/${packetName}`;
  const relativeCoverageDirectory = `<rootDir>/${coverageDirectory}`;
  return {
    ...config,
    displayName: packetName,
    coverageDirectory: `${relativeCoverageDirectory}`,
    reporters: [
      'default',
      ['jest-junit', { outputDirectory: `${relativeCoverageDirectory}`, outputName: `test-results.xml` }],
      ['jest-slow-test-reporter', { numTests: 8, warnOnSlowerThan: 300, color: true }],
      ['jest-html-reporter', { outputPath: `${relativeCoverageDirectory}/report.html` }],
      ['jest-html-reporters', { publicPath: `${relativeCoverageDirectory}`, filename: 'test.html', darkTheme: true}]
    ],
  };
}
module.exports = getJestConfig;
