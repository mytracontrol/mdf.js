/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { InvalidAsn1Error } from '../errors';

/**
 * Checks the data type of the given data.
 * @param data - the data to check.
 * @param type - the type to check against.
 * @param errorMessage - the error message to throw if the data type is not the same as provided.
 * @throws TypeError when the data type is not the same as provided.
 */
export function checkDataType(data: unknown, type: string, errorMessage: string): void {
  let valid = false;

  if (type === 'integer') {
    valid = Number.isInteger(data);
  } else if (type === 'buffer') {
    valid = Buffer.isBuffer(data);
  } else if (type === 'array') {
    valid = Array.isArray(data);
  } else if (typeof data === type) {
    valid = true;
  }

  if (!valid) {
    throw new TypeError(errorMessage);
  }
}

/**
 * Validates and returns the tag value.
 * @param tag - The tag value to validate.
 * @param defaultTag - The default tag value to use if `tag` is not a number.
 * @returns The validated tag value. If `tag` is not a number, the `defaultTag` is returned.
 */
export function validateTag(tag: number | undefined, defaultTag: number): number {
  if (typeof tag !== 'number') {
    return defaultTag;
  }
  return tag;
}

/**
 * Checks if the read tag matches the expected tag.
 * @param expectedTag - The expected tag value.
 * @param readTag - The read tag value to compare with the expected tag.
 * @throws InvalidAsn1Error when the read tag does not match the expected tag.
 */
export function checkExpectedTag(expectedTag: number, readTag: number): void {
  if (expectedTag !== undefined && expectedTag !== readTag) {
    throw new InvalidAsn1Error(
      `Expected 0x${expectedTag.toString(16)}: got 0x${readTag.toString(16)}`
    );
  }
}
