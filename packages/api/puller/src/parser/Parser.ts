/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

/**
 * In this file we translate a code from javascript to typescript.
```js
"use strict";

exports.load = function (received, defaults, onto = {}) {
  var k, ref, v;

  for (k in defaults) {
    v = defaults[k];
    onto[k] = (ref = received[k]) != null ? ref : v;
  }

  return onto;
};

exports.overwrite = function (received, defaults, onto = {}) {
  var k, v;

  for (k in received) {
    v = received[k];

    if (defaults[k] !== void 0) {
      onto[k] = v;
    }
  }

  return onto;
};
```
*/

/**
 * Loads the default values and, if provided, the received into the output.
 * @param received - Received values.
 * @param defaults - Default values.
 * @param onto - Object to be loaded.
 * @returns The object loaded.
 */
export const load = function (
  received: Record<string, any>,
  defaults: Record<string, any>,
  onto: Record<string, any> = {}
): Record<string, any> {
  for (const key in defaults) {
    const defaultValue = defaults[key];
    onto[key] = received[key] ?? defaultValue;
  }
  return onto;
};

/**
 * Overwrites the received values into the output if the default value is not null.
 * @param received - Received values.
 * @param defaults - Default values.
 * @param onto - Object containing the overwritten values.
 * @returns The Object containing the overwritten values.
 */
export const overwrite = function (
  received: Record<string, any>,
  defaults: Record<string, any>,
  onto: Record<string, any> = {}
): Record<string, any> {
  for (const key in received) {
    const receivedValue = received[key];
    if (defaults[key] != null) {
      onto[key] = receivedValue;
    }
  }
  return onto;
};
