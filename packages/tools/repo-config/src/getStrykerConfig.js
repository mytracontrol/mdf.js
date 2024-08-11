/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
const { execSync } = require('child_process');
const config = {
  packageManager: "yarn",
  testRunner: "jest",
  reporters: [
    "html",
    "clear-text",
    "progress",
    "dashboard"
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
  incremental: true,
  tsconfigFile: `tsconfig.spec.json`,
  disableTypeChecks: `src/**/*.ts`,
  mutate: [`src/**/*.ts`, `!src/**/*.test.ts`]
}
module.exports = function (modulePath) {
  const modulePathParts = modulePath.split('/');
  const rootPath = `${__dirname}/../../../..`;
  const module = modulePathParts[modulePathParts.length - 1];
  const packetPath = `${modulePathParts[modulePathParts.length - 2]}/${module}`;
  const gitBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  return {
    ...config,
    dashboard: {
      project: `github.com/mytracontrol/mdf.js`,
      module,
      version: gitBranch,
    },
    tempDirName: `${rootPath}/tmp/${packetPath}/stryker-tmp`,
    htmlReporter: {
      fileName: `${rootPath}/mutations/${packetPath}/report.html`
    }
  }
}
