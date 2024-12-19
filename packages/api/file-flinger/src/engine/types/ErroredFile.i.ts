/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import type { ErrorStrategy } from './ErrorStrategy.t.';

/** The ErroredFile interface */
export interface ErroredFile {
  /** The file path */
  path: string;
  /** The error message */
  errorTrace: string[];
  /** The error strategy to applied */
  strategy: ErrorStrategy;
}
