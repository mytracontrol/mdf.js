/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

/** Health messages types */
export enum HealthMessageType {
  /** Health request for cluster mode, from master to workers */
  REQ = 'health:request',
  /** Health response for cluster mode, from worker to master */
  RES = 'health:response',
}
