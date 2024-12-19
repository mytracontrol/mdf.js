/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import type { InternalKeygenOptions } from './KeygenOptions.i';

/** Default key generator options */
export const DEFAULT_KEY_GEN_OPTIONS: InternalKeygenOptions = {
  /** Match all files */
  filePattern: undefined,
  /** Use the file name as the key */
  keyPattern: '{_filename}',
  /** No default values */
  defaultValues: {},
};
