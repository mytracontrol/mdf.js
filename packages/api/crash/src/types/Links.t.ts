/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

/**
 * Simple link expressed as a regular string
 * @category Boom
 * @public
 */
export type SimpleLink = string;
/**
 * Context links, expressed as map of key-value pairs
 * @category Boom
 * @public
 */
export type ContextLink = { [context: string]: SimpleLink };
/**
 * Links that leads to further details about this particular occurrence of the problem.
 * @category Boom
 * @public
 */
export type Links = { [link: string]: SimpleLink | ContextLink };
