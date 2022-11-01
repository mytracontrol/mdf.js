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
import { BoomHelpers, Crash } from '@mdf/crash';
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
    jwt.verify(token, CONFIG_JWT_TOKEN_SECRET, (error, decoded) => {
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
    });
  };
}

/** AuthZ */
export class AuthZ {
  public static handler(role?: string | string[]): RequestHandler {
    return authZ(role);
  }
}
