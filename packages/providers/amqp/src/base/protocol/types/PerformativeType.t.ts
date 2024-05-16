/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

export const enum PerformativeType {
  /**
   * The first frame sent on a connection in either direction MUST contain an open performative.
   * Note that the connection header which is sent first on the connection is not a frame.
   */
  OPEN = 0x10,
  /** Indicate that a session has begun on the channel */
  BEGIN = 0x11,
  /** The attach frame indicates that a link endpoint has been attached to the session */
  ATTACH = 0x12,
  /* Updates the flow state for the specified link. */
  FLOW = 0x13,
  /**
   * The transfer frame is used to send messages across a link. Messages MAY be carried by a single
   * transfer up to the maximum negotiated frame size for the connection. Larger messages MAY be
   * split across several transfer frames.
   */
  TRANSFER = 0x14,
  /**
   * The disposition frame is used to inform the remote peer of local changes in the state of
   * deliveries. The disposition frame MAY reference deliveries from many different links associated
   * with a session, although all links MUST have the directionality indicated by the specified
   * role.
   */
  DISPOSITION = 0x15,
  /**
   * Detach the link endpoint from the session. This un-maps the handle and makes it available for
   * use by other links.
   */
  DETACH = 0x16,
  /** Indicates that the session has ended. */
  END = 0x17,
  /**
   * Sending a close signals that the sender will not be sending any more frames (or bytes of any
   * other kind) on the connection. Orderly shutdown requires that this frame MUST be written by the
   * sender. It is illegal to send any more frames (or bytes of any other kind) after sending a
   * close frame.
   */
  CLOSE = 0x18,
}
