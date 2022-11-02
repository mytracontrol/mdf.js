/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

export type SimpleLink = string;
export type ContextLink = { [context: string]: SimpleLink };
/**
 * Links that leads to further details about this particular occurrence of the problem.
 * @category Boom
 * @public
 */
export type Links = { [link: string]: SimpleLink | ContextLink };
