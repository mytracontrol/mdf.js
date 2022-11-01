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

import { L4Protocol } from '..';
/** IPv6 connection */
export interface IPv6Connection {
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
