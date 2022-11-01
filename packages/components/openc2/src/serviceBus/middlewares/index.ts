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

import { Boom, Crash } from '@mdf/crash';
import { Socket } from 'socket.io';
export * from './authz';
export * from './check';

export interface ExtendedError extends Error {
  data?: any;
}
export type SocketIONextFunction = (error?: ExtendedError) => void;
export type SocketIOMiddleware = (socket: Socket, next: SocketIONextFunction) => void;

/**
 * Transform a regular Boom error into a SocketIO extended error
 * @param error - error to be transformed to SocketIO extended error
 */
export function transformError(error: Crash | Boom): ExtendedError {
  const extendedError: ExtendedError = new Error(error.message);
  extendedError.data = error.toJSON();
  return extendedError;
}
