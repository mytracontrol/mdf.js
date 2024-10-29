/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

/** Error strategy */
export enum ErrorStrategy {
  /** Ignore the file, emit an error and include in the skipped files */
  IGNORE = 'ignore',
  /** Delete the file, emit an error and include in the skipped files */
  DELETE = 'delete',
  /** Move the file to the dead-letter folder, emit an error and include in the skipped files */
  DEAD_LETTER = 'dead-letter',
}

/** List of error strategies */
export const ERROR_STRATEGIES: ErrorStrategy[] = [
  ErrorStrategy.IGNORE,
  ErrorStrategy.DELETE,
  ErrorStrategy.DEAD_LETTER,
];
