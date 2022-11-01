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
