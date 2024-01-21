/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { ConsumerOptions } from './ConsumerOptions.i';
import { ProducerOptions } from './ProducerOptions.i';

export interface GatewayOptions extends ConsumerOptions, ProducerOptions {
  /** Gateway delay */
  delay?: number;
  /** Bypass lookup interval times checks */
  bypassLookupIntervalChecks?: boolean;
}
