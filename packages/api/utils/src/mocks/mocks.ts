/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

const mocks = new Map();

export function mockProperty<T extends Record<string, unknown>, K extends keyof T>(
  object: T,
  property: K,
  value: T[K]
) {
  const descriptor = Object.getOwnPropertyDescriptor(object, property);
  if (!descriptor) {
    throw new Error(`Property ${String(property)} does not exist in object`);
  }
  const mocksForThisObject = mocks.get(object) || {};
  mocksForThisObject[property] = descriptor;
  mocks.set(object, mocksForThisObject);
  Object.defineProperty(object, property, { get: () => value });
}

export function undoMockProperty<T extends Record<string, unknown>, K extends keyof T>(
  object: T,
  property: K
) {
  Object.defineProperty(object, property, mocks.get(object)[property]);
}

export function undoMocks() {
  for (const [object, mocksForThisObject] of mocks.entries()) {
    for (const [property, descriptor] of Object.entries(mocksForThisObject)) {
      // @ts-ignore
      Object.defineProperty(object, property, descriptor);
    }
  }
  mocks.clear();
}
