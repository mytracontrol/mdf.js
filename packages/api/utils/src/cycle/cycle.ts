/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

export function deCycle(object: any, replacer?: (value: any) => any) {
  const seen = new WeakMap();

  return (function unref(value: any, path: string) {
    let oldPath: string;
    let newObject: any;
    if (replacer !== undefined) {
      value = replacer(value);
    }
    if (isObject(value)) {
      oldPath = seen.get(value);
      if (oldPath !== undefined) {
        return { $ref: oldPath };
      }
      seen.set(value, path);

      if (Array.isArray(value)) {
        newObject = [];
        value.forEach((element, index) => {
          newObject[index] = unref(element, `${path}['${index}']`);
        });
      } else {
        newObject = {};
        for (const name of Object.keys(value)) {
          //@ts-ignore - index signature
          newObject[name] = unref(value[name], `${path}[${JSON.stringify(name)}]`);
        }
      }
      return newObject;
    }
    return value;
  })(object, '$');
}
export function retroCycle($: any) {
  const px = /^\$(?:\[(?:\d+|"(?:[^\\"\u0000-\u001f]|\\(?:[\\"\/bfnrt]|u[0-9a-zA-Z]{4}))*")\])*$/;
  function processArray(value: any[]) {
    value.forEach((item, i) => {
      if (typeof item === 'object' && item !== null) {
        const path = item.$ref;
        if (typeof path === 'string' && px.test(path)) {
          value[i] = eval(path);
        } else {
          rez(item);
        }
      }
    });
  }
  function processObject(object: any) {
    for (const key in object) {
      if (object.hasOwnProperty(key)) {
        const item = object[key];
        if (typeof item === 'object' && item !== null) {
          const path = item.$ref;
          if (typeof path === 'string' && px.test(path)) {
            object[key] = eval(path);
          } else {
            rez(item);
          }
        }
      }
    }
  }

  function rez(value: any) {
    if (value && typeof value === 'object') {
      if (Array.isArray(value)) {
        processArray(value);
      } else {
        processObject(value);
      }
    }
  }

  rez($);
  return $;
}

/**
 * Check if a value is valid object
 * @param value - The value to be checked
 */
function isObject(value: object): value is object {
  return (
    typeof value === 'object' &&
    value !== null &&
    !(value instanceof Boolean) &&
    !(value instanceof Date) &&
    !(value instanceof Number) &&
    !(value instanceof RegExp) &&
    !(value instanceof String)
  );
}
