/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

const fileName = './sonar-project.properties';

import fs from 'fs';
import { globSync } from 'glob';
import os from 'os';

const folders = globSync("packages/*/*");
console.log(folders);
fs.writeFileSync(fileName, `sonar.projectKey=Mytra-Development-Framework-NDF-TypeScript\n`);
fs.appendFileSync(fileName, `sonar.projectName=Mytra Development Framework - NDF - TypeScript\n`);
fs.appendFileSync(fileName, `sonar.modules=${folders.map((folder) => {
  const parts = folder.split(os.platform() === 'win32' ? '\\' : '/');
  return `${parts[parts.length - 2]}-${parts[parts.length - 1]}`;
}).join(',')}\n`);
fs.appendFileSync(fileName, 'sonar.exclusions=coveragereport/**/*,packages/**/*.test.ts,packages/**/test/*.ts,packages/**/*.js\n\n');
for (const folder of folders) {
  const parts = folder.split(os.platform() === 'win32' ? '\\' : '/');
  const subFolderPath = `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
  const moduleName = `${parts[parts.length - 2]}-${parts[parts.length - 1]}`;
  fs.appendFileSync(fileName, `${moduleName}.sonar.projectName=NDS-${moduleName.toLocaleUpperCase()}-Typescript\n`);
  fs.appendFileSync(fileName, `${moduleName}.sonar.projectBaseDir=${folder.replace(/\\/g, '/')}\n`);
  fs.appendFileSync(fileName, `${moduleName}.sonar.sources=src\n`);
  fs.appendFileSync(fileName, `${moduleName}.sonar.inclusions=src/**/*\n`);
  fs.appendFileSync(fileName, `${moduleName}.sonar.exclusions=src/**/*.test.ts,src/**/test/*.ts\n`);
  fs.appendFileSync(fileName, `${moduleName}.sonar.test.inclusions=src/**/*.test.ts\n`);
  fs.appendFileSync(fileName, `${moduleName}.sonar.javascript.lcov.reportPaths=../../../coverage/${subFolderPath}/lcov.info\n`);
  fs.appendFileSync(fileName, `${moduleName}.sonar.junit.reportPaths=../../../coverage/${subFolderPath}/test-results.xml\n`);
  fs.appendFileSync(fileName, `${moduleName}.sonar.typescript.tsconfigPath=tsconfig.build.json\n\n`);
}