/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Hashes, Payload } from '..';
/** File-like object or a link to that object */
export interface Artifact {
  /** Permitted values specified in the IANA Media Types registry, [RFC6838] */
  mime_type?: string;
  /** Choice of literal content or URL */
  payload?: Payload;
  /** Hashes of the payload content */
  hashes?: Hashes;
}
