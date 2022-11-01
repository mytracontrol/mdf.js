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

import { StandardErrorCategories } from './StandardErrorCategories.t';

export interface BaseOptions {
  /** Name of the error, used as a category */
  name?: StandardErrorCategories;
  /** Extra information error */
  info?: {
    /** Subject to which the error relates */
    subject?: string;
    /** Date of the error */
    date?: Date;
    /** Any other relevant information */
    [x: string]: any;
  };
  /** Other key information from extends error */
  [x: string]: unknown;
}
