/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

/** Choice of literal content or URL */
export interface Payload {
  /** Specifies the data contained in the artifact */
  bin?: string;
  /** MUST be a valid URL that resolves to the un-encoded content */
  url?: string;
}
