/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 * Note: All information contained herein is, and remains the property of Netin System S.L. and its
 * suppliers, if any. The intellectual and technical concepts contained herein are property of
 * Netin System S.L. and its suppliers and may be covered by European and Foreign patents, patents
 * in process, and are protected by trade secret or copyright.
 *
 * Dissemination of this information or the reproduction of this material is strictly forbidden
 * unless prior written permission is obtained from Netin System S.L.
 */
import { BoomHelpers, Crash } from '@mdf.js/crash';
import jwt, { Algorithm, JwtPayload } from 'jsonwebtoken';
import { Socket } from 'socket.io';
import { v4 } from 'uuid';
import { SocketIOMiddleware, SocketIONextFunction, transformError } from '..';

const CONFIG_JWT_TOKEN_SECRET = process.env['CONFIG_JWT_TOKEN_SECRET'] || v4();
process.env['CONFIG_JWT_TOKEN_SECRET'] = CONFIG_JWT_TOKEN_SECRET;

export type AuthZOptions = {
  secret?: string;
  algorithms?: Algorithm[];
  onAuthorization?: (decodedToken: JwtPayload) => Promise<void>;
};
/**
 * Check the token of the request
 * @param role - role to be checked
 * @returns
 */
function authZ(options: AuthZOptions = {}): SocketIOMiddleware {
  return (socket: Socket, next: SocketIONextFunction) => {
    const token = socket.handshake.auth['token'];
    const secret = options.secret || CONFIG_JWT_TOKEN_SECRET;
    const algorithms = options.algorithms || ['HS256'];
    const defaultOnAuthorization = () => Promise.resolve();
    const onAuthorization = options.onAuthorization || defaultOnAuthorization;
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
): Promise<jwt.JwtPayload> {
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
