/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Boom, BoomHelpers, Crash } from '@mdf.js/crash';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import jwt, { Algorithm, JwtPayload } from 'jsonwebtoken';
import { v4 } from 'uuid';

const DEFAULT_CONFIG_JWT_TOKEN_SECRET = v4();
const DEFAULT_CONFIG_JWT_TOKEN_ALGORITHMS: Algorithm[] = ['HS256'];
const DEFAULT_CONFIG_JWT_ON_AUTHORIZATION = () => {};

type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

/** Options for configuring authorization middleware */
export type AuthZOptions = {
  /** The secret used to sign and verify JWT tokens */
  secret?: string;
  /** The algorithms used for JWT token verification */
  algorithms?: Algorithm[];
  /** The role(s) required for accessing the protected route */
  role?: string | string[];
  /**
   * A callback function called when authorization is successful.
   * @param decodedToken - The decoded JWT payload.
   */
  onAuthorization?: (decodedToken: JwtPayload) => {};
};

/**
 * Check the token of the request
 * @param options - authorization options
 * @returns
 */
function authZ(options: AuthZOptions = {}): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (typeof options !== 'object' || Array.isArray(options)) {
        throw new Crash(`Error in the authz middleware configuration`, req.uuid);
      }
      const onAuthorization = options.onAuthorization || DEFAULT_CONFIG_JWT_ON_AUTHORIZATION;
      onAuthorization(
        verify(
          hasValidAuthenticationInformation(req.headers.authorization, req.uuid),
          {
            secret: options.secret || DEFAULT_CONFIG_JWT_TOKEN_SECRET,
            algorithms: options.algorithms || DEFAULT_CONFIG_JWT_TOKEN_ALGORITHMS,
            role: hasValidRole(options.role, req.uuid),
          },
          req.uuid
        )
      );
      next();
    } catch (error) {
      next(error);
      return;
    }
  };
}
/**
 * Check if the token is a valid token
 * @param token - token to be verified
 * @param uuid - request identifier
 * @returns
 */
function hasValidAuthenticationInformation(token: string | undefined, uuid: string): string {
  if (!token) {
    throw BoomHelpers.badRequest(`No present authorization information`, uuid);
  } else if (typeof token !== 'string') {
    throw BoomHelpers.badRequest(`Malformed authorization information`, uuid);
  } else {
    const parts = token.split(' ');
    if (parts.length !== 2) {
      throw BoomHelpers.badRequest(`Malformed request, malformed authorization token`, uuid);
    }
    return parts[1];
  }
}
/**
 * Check if a role is valid
 * @param role - role to be checked
 * @param uuid - request identifier
 */
function hasValidRole(
  role: string | string[] | undefined,
  uuid: string
): string | string[] | undefined {
  if (
    !role ||
    typeof role === 'string' ||
    (Array.isArray(role) && role.length > 0 && role.every(item => typeof item === 'string'))
  ) {
    return role;
  } else {
    throw new Crash(`Error in the role authz middleware configuration`, uuid);
  }
}
/**
 * Verifies the JWT token and returns the decoded payload.
 *
 * @param token - The JWT token to verify.
 * @param options - The options for JWT verification.
 * @param uuid - The unique identifier for error tracking.
 * @returns The decoded payload of the JWT token.
 * @throws {Crash} If there is an error verifying the JWT token.
 * @throws {BoomHelpers.BadRequest} If the JWT token is malformed.
 * @throws {BoomHelpers.Unauthorized} If the user is not authorized.
 * @throws {BoomHelpers.Unauthorized} If the JWT token is not valid.
 */
function verify(
  token: string,
  options: WithRequired<Omit<AuthZOptions, 'onAuthorization'>, 'secret' | 'algorithms'>,
  uuid: string
): JwtPayload {
  try {
    const decoded = jwt.verify(token, options.secret, { algorithms: options.algorithms });
    if (!decoded) {
      throw new Crash(`Error verifying the JWT token`, uuid);
    }
    if (typeof decoded === 'string') {
      throw BoomHelpers.badRequest(`Malformed request, malformed authorization token`, uuid);
    }
    if (typeof decoded['user'] !== 'string' || typeof decoded['role'] !== 'string') {
      throw BoomHelpers.badRequest(`Malformed request, malformed authorization token`, uuid);
    }
    if (options.role) {
      const allowedRoles = Array.isArray(options.role) ? options.role : [options.role];
      if (!allowedRoles.includes(decoded['role'])) {
        throw BoomHelpers.unauthorized(`Not authorized`, uuid);
      }
    }
    return decoded;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw BoomHelpers.unauthorized(`No valid token`, uuid);
    } else if (error instanceof Boom) {
      throw error;
    } else {
      throw Crash.from(error);
    }
  }
}

/** AuthZ */
export class AuthZ {
  /**
   * Perform the authorization based on jwt token for Socket.IO
   * @param options - authorization options
   * @returns
   */
  public static handler(options?: AuthZOptions): RequestHandler {
    return authZ(options);
  }
}
