/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Boom, Crash } from '@mdf.js/crash';
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
