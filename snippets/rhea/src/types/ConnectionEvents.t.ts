/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

/** Events that can be emitted by a connection. */
export enum ConnectionEvents {
  /** Raised when the remote peer indicates the connection is open. */
  connectionOpen = 'connection_open',
  /** Raised when the remote peer indicates the connection is closed. */
  connectionClose = 'connection_close',
  /** Raised when the remote peer indicates an error occurred on the connection. */
  connectionError = 'connection_error',
  /** Raised when a protocol error is received on the underlying socket. */
  protocolError = 'protocol_error',
  /** Raised when an error is received on the underlying socket. */
  error = 'error',
  /**
   * Raised when the underlying tcp connection is lost. The context has a reconnecting property
   * which is true if the library is attempting to automatically reconnect and false if it has
   * reached the reconnect limit. If reconnect has not been enabled or if the connection is a tcp
   * server, then the reconnecting property is undefined. The context may also have an error
   * property giving some information about the reason for the disconnect.
   */
  disconnected = 'disconnected',
  /** Raised when the connection receives a disposition. */
  settled = 'settled',
}
