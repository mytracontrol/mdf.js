/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
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
