/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { APISource } from './APISource.i';
import { BaseOptions } from './BaseOptions.i';
import { Cause } from './Cause.t';
import { Links } from './Links.t';

/**
 * Boom error configuration options
 * @category Boom
 * @public
 */
export interface BoomOptions extends BaseOptions {
  links?: Links;
  source?: APISource;
  cause?: Cause;
}
