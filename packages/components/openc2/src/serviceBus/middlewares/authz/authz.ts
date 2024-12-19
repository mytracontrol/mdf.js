/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { BoomHelpers, Crash } from '@mdf.js/crash';
import jwt, { Algorithm, JwtPayload } from 'jsonwebtoken';
import { Socket } from 'socket.io';
import { v4 } from 'uuid';
import { SocketIOMiddleware, SocketIONextFunction, transformError } from '..';

const DEFAULT_CONFIG_JWT_TOKEN_SECRET = v4();
const DEFAULT_CONFIG_JWT_TOKEN_ALGORITHMS: Algorithm[] = ['HS256'];
const DEFAULT_CONFIG_JWT_ON_AUTHORIZATION = () => Promise.resolve();

/** Options for configuring authorization middleware */
export type AuthZOptions = {
  /** The secret used to sign and verify JWT tokens */
  secret?: string;
  /** The algorithms used for JWT token verification */
  algorithms?: Algorithm[];
  /**
   * A callback function called when authorization is successful.
   * @param decodedToken - The decoded JWT payload.
   */
  onAuthorization?: (decodedToken: JwtPayload) => Promise<void>;
};
/**
 * Check the token of the request
 * @param options - authorization options
 * @returns
 */
function authZ(options: AuthZOptions = {}): SocketIOMiddleware {
  return (socket: Socket, next: SocketIONextFunction) => {
    const token = socket.handshake.auth['token'];
    const secret = options.secret ?? DEFAULT_CONFIG_JWT_TOKEN_SECRET;
    const algorithms = options.algorithms ?? DEFAULT_CONFIG_JWT_TOKEN_ALGORITHMS;
    const onAuthorization = options.onAuthorization ?? DEFAULT_CONFIG_JWT_ON_AUTHORIZATION;
    const requestId = v4();

    hasValidAuthenticationInformation(token, requestId)
      .then(reportedToken => verify(reportedToken, { secret, algorithms }, requestId))
      .then(onAuthorization)
      .then(() => next())
      .catch(error => next(transformError(error)));
  };
}
/**
 * Check if the token is present and an string
 * @param token - token to checked
 * @param uuid - request identifier
 * @returns
 */
function hasValidAuthenticationInformation(token: string, uuid: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!token) {
      reject(BoomHelpers.badRequest(`No present authorization information`, uuid));
    } else if (typeof token !== 'string') {
      reject(BoomHelpers.badRequest(`Malformed authorization information`, uuid));
    } else {
      resolve(token);
    }
  });
}
/**
 * Check if the token is a valid token
 * @param token - token to be verified
 * @param options - authorization options
 * @param uuid - request identifier
 * @returns
 */
function verify(
  token: string,
  options: Required<Omit<AuthZOptions, 'onAuthorization'>>,
  uuid: string
): Promise<JwtPayload> {
  return new Promise((resolve, reject) => {
    jwt.verify(token, options.secret, { algorithms: options.algorithms }, (error, decoded) => {
      if (error) {
        reject(BoomHelpers.unauthorized(`No valid token: ${error.message}`, uuid));
      } else if (!decoded) {
        reject(new Crash(`Error verifying the JWT token`, uuid));
      } else if (typeof decoded === 'string') {
        reject(BoomHelpers.badRequest(`Malformed request, malformed authorization token`, uuid));
      } else {
        resolve(decoded);
      }
    });
  });
}
/** AuthZ */
export class AuthZ {
  /**
   * Perform the authorization based on jwt token for Socket.IO
   * @param options - authorization options
   * @returns
   */
  public static handler(options?: AuthZOptions): SocketIOMiddleware {
    return authZ(options);
  }
}

