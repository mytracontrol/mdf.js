/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
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
