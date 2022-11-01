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
