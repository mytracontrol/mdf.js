/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Hashes } from '..';
/** A "File" Target MUST contain at least one property. */
export interface File {
  /** One or more cryptographic hash codes of the file contents */
  hashes?: Hashes;
  /** The name of the file as defined in the file system */
  name?: string;
  /** The absolute path to the location of the file in the file system */
  path?: string;
}
