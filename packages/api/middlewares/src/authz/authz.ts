/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { BoomHelpers, Crash } from '@mdf.js/crash';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import jwt from 'jsonwebtoken';
import { v4 } from 'uuid';

const CONFIG_JWT_TOKEN_SECRET = process.env['CONFIG_JWT_TOKEN_SECRET'] || v4();
process.env['CONFIG_JWT_TOKEN_SECRET'] = CONFIG_JWT_TOKEN_SECRET;

type ValidRole = string | string[] | undefined;
/**
 * Check if a role is valid
 * @param role - role to be checked
 */
function isValidRole(role?: string | string[]): role is ValidRole {
  if (!role) {
    return true;
  } else if (typeof role === 'string') {
    return true;
  } else if (Array.isArray(role)) {
    return role.every(item => typeof item === 'string');
  } else {
    return false;
  }
}
/**
 * Check the token of the request
 * @param role - role to be checked
 * @returns
 */
function authZ(role?: string | string[]): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const auth = req.headers.authorization;
    if (!auth) {
      next(BoomHelpers.badRequest(`Malformed request, no present authorization token`, req.uuid));
      return;
    }
    const parts = auth.split(' ');
    if (parts.length !== 2) {
      next(BoomHelpers.badRequest(`Malformed request, malformed authorization token`, req.uuid));
      return;
    }
    const token = parts[1];
    jwt.verify(token, CONFIG_JWT_TOKEN_SECRET, verify(req, next, role));
  };
}

/**
 * Verify the token
 * @param req - request
 * @param next - next function
 * @param role - role to be checked
 */
function verify(
  req: Request,
  next: NextFunction,
  role?: string | string[]
): (error: jwt.VerifyErrors | null, decoded: string | jwt.JwtPayload | undefined) => void {
  return (error: jwt.VerifyErrors | null, decoded: string | jwt.JwtPayload | undefined) => {
    if (error) {
      next(BoomHelpers.unauthorized(`No valid token`, req.uuid));
      return;
    }
    if (!decoded) {
      next(new Crash(`Error verifying the JWT token`, req.uuid));
      return;
    }
    if (typeof decoded === 'string') {
      next(BoomHelpers.badRequest(`Malformed request, malformed authorization token`, req.uuid));
      return;
    }
    req.user = decoded['user'];
    req.role = decoded['role'];

    if (typeof req.user !== 'string' || typeof req.role !== 'string') {
      next(BoomHelpers.badRequest(`Malformed request, malformed authorization token`, req.uuid));
      return;
    }
    if (!isValidRole(role)) {
      next(new Crash(`Error in the role authz middleware configuration`, req.uuid));
      return;
    }
    if (role) {
      const allowedRoles = Array.isArray(role) ? role : [role];
      if (!allowedRoles.includes(decoded['role'])) {
        next(BoomHelpers.unauthorized(`You are not authorized`, req.uuid));
        return;
      }
    }
    next();
  };
}

/** AuthZ */
export class AuthZ {
  public static handler(role?: string | string[]): RequestHandler {
    return authZ(role);
  }
}
