/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

/** No more extra headers information */
export interface NoMoreHeaders {}
/** Any other extra header information */
export type AnyHeaders = Record<string, any>;
/** Job headers */
export type Headers<T extends Record<string, any> = AnyHeaders> = T;
