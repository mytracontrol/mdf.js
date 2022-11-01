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
