/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 * Note: All information contained herein is, and remains the property of Mytra Control S.L. and its
 * suppliers, if any. The intellectual and technical concepts contained herein are property of
 * Mytra Control S.L. and its suppliers and may be covered by European and Foreign patents, patents
 * in process, and are protected by trade secret or copyright.
 *
 * Dissemination of this information or the reproduction of this material is strictly forbidden
 * unless prior written permission is obtained from Mytra Control S.L.
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
