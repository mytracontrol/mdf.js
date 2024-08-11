/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { pickBy } from 'lodash';

/**
 * Return the an object with the keys that are prefixed with the given prefix
 * @param object - object to be filtered
 * @param prefix - prefix to be filtered
 * @returns
 */
export function filterUnprefixed(
  object: Record<string, string | undefined>,
  prefix?: string
): Record<string, string | undefined> {
  if (typeof prefix === 'string') {
    return pickBy(object, (value, key) => key.startsWith(prefix));
  } else {
    return object;
  }
}
