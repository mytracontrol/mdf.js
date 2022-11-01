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
const fs = require('fs');
const glob = require('glob');
glob("packages/*/*", (err, folders) => {
  console.log(folders);
  fs.writeFileSync('sonar-project.properties', `sonar.projectKey=Mytra-Development-Framework-NDF-TypeScript\n`);
  fs.appendFileSync('sonar-project.properties', `sonar.projectName=Mytra Development Framework - NDF - TypeScript\n`);
  fs.appendFileSync('sonar-project.properties', `sonar.modules=${folders.map((folder) => {
    const parts = folder.split('/');
    return `${parts[parts.length - 2]}-${parts[parts.length - 1]}`;
  }).join(',')}\n`);
  fs.appendFileSync('sonar-project.properties', 'sonar.exclusions=coveragereport/**/*,packages/**/*.test.ts,packages/**/test/*.ts,packages/**/*.js\n\n');
  for (const folder of folders) {
    const parts = folder.split('/');
    const subFolderPath = `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
    const moduleName = `${parts[parts.length - 2]}-${parts[parts.length - 1]}`;
    fs.appendFileSync('sonar-project.properties', `${moduleName}.sonar.projectName=NDS-${moduleName.toLocaleUpperCase()}-Typescript\n`);
    fs.appendFileSync('sonar-project.properties', `${moduleName}.sonar.projectBaseDir=${folder}\n`);
    fs.appendFileSync('sonar-project.properties', `${moduleName}.sonar.sources=src\n`);
    fs.appendFileSync('sonar-project.properties', `${moduleName}.sonar.inclusions=src/**/*\n`);
    fs.appendFileSync('sonar-project.properties', `${moduleName}.sonar.inclusions=src/**/*.test.ts,src/**/test/*.ts\n`);
    fs.appendFileSync('sonar-project.properties', `${moduleName}.sonar.test.inclusions=src/**/*.test.ts\n`);
    fs.appendFileSync('sonar-project.properties', `${moduleName}.sonar.javascript.lcov.reportPaths=../../../coverage/${subFolderPath}/lcov.info\n`);
    fs.appendFileSync('sonar-project.properties', `${moduleName}.sonar.junit.reportPaths=../../../coverage/${subFolderPath}/test-results.xml\n`);
    fs.appendFileSync('sonar-project.properties', `${moduleName}.sonar.typescript.tsconfigPath=tsconfig.build.json\n\n`);
  }
})
