/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash } from '@mdf.js/crash';
import fs from 'fs';

/**
 * Load the file from the path if this exist
 * @param path - path to file
 * @returns
 */
export function loadFile(path?: string, logger?: (message: string) => void): Buffer | undefined {
  const ownLogger = (message: string) => {
    if (logger) {
      logger(message);
    }
  };
  if (!path) {
    ownLogger('No path provided');
    return undefined;
  } else if (path && fs.existsSync(path)) {
    try {
      return fs.readFileSync(path);
    } catch (rawError) {
      ownLogger(Crash.from(rawError).message);
      return undefined;
    }
  } else {
    // Stryker disable next-line all
    ownLogger(`No such file at path ${path}`);
    return undefined;
  }
}
