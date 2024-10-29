/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import type { Layer } from '@mdf.js/core';

/** Pusher interface */
export interface Pusher extends Layer.App.Resource {
  /**
   * Push the file to the storage
   * @param filePath - The file path to push
   * @param key - The key to use
   */
  push(filePath: string, key: string): Promise<void>;
}
