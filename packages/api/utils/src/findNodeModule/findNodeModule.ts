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
import fs from 'fs';
import path from 'path';

/**
 * Find the path to a node module in every parent directory (node_modules).
 * @param module - Module name
 * @param dir - Directory to start searching from
 * @returns
 */
export function findNodeModule(module: string, dir: string = __dirname): string | undefined {
  let modulePath: string | undefined;
  let currentDir = dir;
  let prevDir: string | undefined;
  while (currentDir !== prevDir) {
    const nodeModules = path.join(currentDir, 'node_modules', module);
    if (fs.existsSync(nodeModules)) {
      modulePath = nodeModules;
    }
    prevDir = currentDir;
    currentDir = path.dirname(currentDir);
  }
  return modulePath;
}
