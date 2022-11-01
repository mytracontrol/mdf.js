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
const config = {
  packageManager: "yarn",
  testRunner: "jest",
  reporters: [
    "html",
    "clear-text",
    "progress"
  ],
  checkers: [
    "typescript"
  ],
  coverageAnalysis: "perTest",
  ignoreStatic: true,
  thresholds: {
    "high": 80,
    "low": 60,
    "break": 60
  },
  jest: {
    projectType: "custom",
    configFile: `jest.config.js`,
  },
  tsconfigFile: `tsconfig.spec.json`,
  disableTypeChecks: `src/**/*.ts`,
  mutate: [`src/**/*.ts`, `!src/**/*.test.ts`]
}
module.exports = function (modulePath) {
  const modulePathParts = modulePath.split('/');
  const rootPath = `${__dirname}/../../../..`;
  const packetPath = `${modulePathParts[modulePathParts.length - 2]}/${modulePathParts[modulePathParts.length - 1]}`;
  return {
    ...config,
    tempDirName: `${rootPath}/tmp/${packetPath}/stryker-tmp`,
    htmlReporter: {
      fileName: `${rootPath}/mutations/${packetPath}/report.html`
    }
  }
}
