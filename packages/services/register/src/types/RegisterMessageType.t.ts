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

/** Register messages types */
export enum RegisterMessageType {
  /** Register errors request for cluster mode, from master to workers */
  REQ = 'register:errors:request',
  /** Register errors response for cluster mode, from worker to master */
  RES = 'register:errors:response',
  /** Register clear request for cluster mode, from master to workers */
  CLR_REQ = 'register:clear:request',
}
