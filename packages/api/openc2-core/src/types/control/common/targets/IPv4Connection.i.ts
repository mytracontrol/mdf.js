/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { L4Protocol } from '..';
/** IPv4 Connection*/
export interface IPv4Connection {
  /** IPv4 destination address range */
  dst_addr?: string;
  /** Destination service per [RFC6335] */
  dst_port?: number;
  /** Layer 4 protocol (e.g., TCP) */
  protocol?: L4Protocol;
  /** IPv4 source address range */
  src_addr?: string;
  /** Source service per [RFC6335] */
  src_port?: number;
}
