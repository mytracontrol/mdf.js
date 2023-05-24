/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

/** One or more cryptographic hash codes of the file contents */
export interface Hashes {
  /** MD5 hash as defined in [RFC1321] */
  md5?: string;
  /** SHA1 hash as defined in [RFC6234] */
  sha1?: string;
  /** SHA256 hash as defined in [RFC6234] */
  sha256?: string;
}
