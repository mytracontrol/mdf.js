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
