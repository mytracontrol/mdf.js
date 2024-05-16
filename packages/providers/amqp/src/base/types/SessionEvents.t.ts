/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

/** Events that can be emitted by a session */
export enum SessionEvents {
  /** Raised when the remote peer indicates the session is open (i.e., attached in AMQP parlance). */
  sessionOpen = 'session_open',
  /** Raised when the remote peer receives an error. The context may also have an error property giving some information about the reason for the error. */
  sessionError = 'session_error',
  /** Raised when the remote peer indicates the session is closed. */
  sessionClose = 'session_close',
  /** Raised when the session receives a disposition. */
  settled = 'settled',
}
