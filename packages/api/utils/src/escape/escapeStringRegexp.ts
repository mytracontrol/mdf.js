/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import util from 'util';

export function escapeRegExp(regex: RegExp): string {
  if (!util.types.isRegExp(regex)) {
    throw new TypeError('Expected a RegExp');
  }
  return regex.source;
}
