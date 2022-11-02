/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Format } from './Format.t';
import { FormatFunction } from './FormatFunction.t';

export interface ReadEnvOptions {
  separator: string;
  includePrefix: boolean;
  format: Format | FormatFunction;
}
