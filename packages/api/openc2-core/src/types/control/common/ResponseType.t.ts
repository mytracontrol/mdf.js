/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

/** Expected response type*/
export enum ResponseType {
  /** No response */
  None = 'none',
  /** Respond when Command received */
  ACK = 'ack',
  /** Respond with progress toward Command completion */
  Status = 'status',
  /** Respond when all aspects of Command completed */
  Complete = 'complete',
}
