/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { SASLMethods } from '../../../SASLMethods.t';
import { Frame } from '../Frame.i';

export interface SASLFrame extends Frame {
  /** AMQP frame type */
  saslMethod: SASLMethods;
}
