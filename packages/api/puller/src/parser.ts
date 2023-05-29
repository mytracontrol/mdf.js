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
export const load = function (
  received: Record<string, any>,
  defaults: Record<string, any>,
  onto: Record<string, any> = {}
): Record<string, any> {
  let k, ref, v;
  for (k in defaults) {
    v = defaults[k];
    onto[k] = (ref = received[k]) != null ? ref : v;
  }
  return onto;
};
export const overwrite = function (
  received: Record<string, any>,
  defaults: Record<string, any>,
  onto: Record<string, any> = {}
): Record<string, any> {
  let k, v;
  for (k in received) {
    v = received[k];
    if (defaults[k] !== void 0) {
      onto[k] = v;
    }
  }
  return onto;
};
