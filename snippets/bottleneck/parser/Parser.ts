/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

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
