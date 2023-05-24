/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

/**
 * Context interface from Joi library
 * @public
 * @category Joi integration
 */
export interface Context {
  [key: string]: any;
  key?: string;
  label?: string;
  value?: any;
}

/**
 * ValidationErrorItem interface from Joi library
 * @public
 * @category Joi integration
 */
export interface ValidationErrorItem {
  message: string;
  path: Array<string | number>;
  type: string;
  context?: Context;
}

/**
 * ValidationError interface from Joi library
 * @public
 * @category Joi integration
 */
export interface ValidationError extends Error {
  name: 'ValidationError';
  isJoi: boolean;
  /** Array of errors */
  details: ValidationErrorItem[];
  /**
   * Function that returns a string with an annotated version of the object pointing at the places
   * where errors occurred.
   * NOTE: This method does not exist in browser builds of Joi
   * @param stripColors - if truthy, will strip the colors out of the output.
   */
  annotate(stripColors?: boolean): string;
  _original: any;
}
