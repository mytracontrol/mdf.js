/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

/** Layer 4 protocol */
export enum L4Protocol {
  /** Internet Control Message Protocol - [RFC0792] */
  ICMP = 'icmp',
  /** Transmission Control Protocol - [RFC0793] */
  SCTP = 'sctp',
  /** User Datagram Protocol - [RFC0768] */
  TCP = 'tcp',
  /** Stream Control Transmission Protocol - [RFC4960] */
  UDP = 'udp',
}
