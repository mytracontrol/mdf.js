/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

/**
 * Options for the Batcher
 */
export interface BatcherOptions {
  maxTime?: number | null;
  maxSize?: number | null;
}

/**
 * Complete options for the Batcher
 */
export interface BatcherOptionsComplete {
  maxTime: number | null;
  maxSize: number | null;
}
