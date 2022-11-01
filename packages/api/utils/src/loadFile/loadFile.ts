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
