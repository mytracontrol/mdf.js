/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

/** Shared error conditions. */
export enum AMQPError {
  /**
   * An internal error occurred. Operator intervention might be necessary to resume normal
   * operation.
   */
  INTERNAL_ERROR = 'amqp:internal-error',
  /** A peer attempted to work with a remote entity that does not exist */
  NOT_FOUND = 'amqp:not-found',
  /**
   * A peer attempted to work with a remote entity to which it has no access due to security
   * settings.
   */
  UNAUTHORIZED_ACCESS = 'amqp:unauthorized-access',
  /** Data could not be decoded */
  DECODE_ERROR = 'amqp:decode-error',
  /** A peer exceeded its resource allocation */
  RESOURCE_LIMIT_EXCEEDED = 'amqp:resource-limit-exceeded',
  /**
   * The peer tried to use a frame in a manner that is inconsistent with the semantics defined in
   * the specification.
   */
  NOT_ALLOWED = 'amqp:not-allowed',
  /** An invalid field was passed in a frame body, and the operation could not proceed */
  INVALID_FIELD = 'amqp:invalid-field',
  /** The peer tried to use functionality that is not implemented in its partner */
  NOT_IMPLEMENTED = 'amqp:not-implemented',
  /**
   * The client attempted to work with a server entity to which it has no access because another
   * client is working with it.
   */
  RESOURCE_LOCKED = 'amqp:resource-locked',
  /** The client made a request that was not allowed because some precondition failed */
  PRECONDITION_FAILED = 'amqp:precondition-failed',
  /** A server entity the client is working with has been deleted */
  RESOURCE_DELETED = 'amqp:resource-deleted',
  /** The peer sent a frame that is not permitted in the current state */
  ILLEGAL_STATE = 'amqp:illegal-state',
  /**
   * The peer cannot send a frame because the smallest encoding of the performative with the
   * currently valid values would be too large to fit within a frame of the agreed maximum frame
   * size. When transferring a message the message data can be sent in multiple transfer frames
   * thereby avoiding this error. Similarly when attaching a link with a large unsettled map the
   * endpoint MAY make use of the incomplete-unsettled flag to avoid the need for overly large
   * frames.
   */
  FRAME_SIZE_TOO_SMALL = 'amqp:frame-size-too-small',
}

/**Symbols used to indicate connection error conditions. */
export enum ConnectionError {
  /** An operator intervened to close the connection for some reason. The client could retry at some later date. */
  CONNECTION_FORCED = 'amqp:connection:forced',
  /** A valid frame header cannot be formed from the incoming byte stream. */
  FRAMING_ERROR = 'amqp:connection:framing-error',
  /** The container is no longer available on the current connection. The peer SHOULD attempt reconnection to the container using the details provided in the info map. */
  REDIRECT = 'amqp:connection:redirect',
}

/** Symbols used to indicate session error conditions. */
export enum SessionError {
  /** The peer violated incoming window for the session. */
  WINDOW_VIOLATION = 'amqp:session:window-violation',
  /** Input was received for a link that was detached with an error. */
  ERRANT_LINK = 'amqp:session:errant-link',
  /** An attach was received using a handle that is already in use for an attached link. */
  HANDLE_IN_USE = 'amqp:session:handle-in-use',
  /**
   * A frame (other than attach) was received referencing a handle which is not currently in use of
   * an attached link.
   */
  UNATTACHED_HANDLE = 'amqp:session:unattached-handle',
}

/** Symbols used to indicate link error conditions. */
export enum LinkError {
  /** An operator intervened to detach for some reason. */
  DETACH_FORCED = 'amqp:link:detach-forced',
  /** The peer sent more message transfers than currently allowed on the link. */
  TRANSFER_LIMIT_EXCEEDED = 'amqp:link:transfer-limit-exceeded',
  /** The peer sent a larger message than is supported on the link. */
  MESSAGE_SIZE_EXCEEDED = 'amqp:link:message-size-exceeded',
  /**
   * The address provided cannot be resolved to a terminus at the current container. The info map
   * MAY contain the following information to allow the client to locate the attach to the terminus.
   */
  REDIRECT = 'amqp:link:redirect',
  /** The link has been attached elsewhere, causing the existing attachment to be forcibly closed. */
  STOLEN = 'amqp:link:stolen',
}

/** Error conditions that can be returned by the AMQP protocol. */
export type ErrorCondition = AMQPError | ConnectionError | SessionError | LinkError;
