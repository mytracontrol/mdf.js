/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Crash, Multi } from '@mdf.js/crash';
import { coerce } from '@mdf.js/utils';
import { NextFunction, Request, Response } from 'express';

/** Validator class */
export class Validator {
  /**
   * Return all the actual metrics of this artifact
   * @param request - HTTP request express object
   * @param response - HTTP response express object
   * @param next - Next express middleware function
   */
  public metrics(request: Request, response: Response, next: NextFunction): void {
    if (request.query['json'] && typeof coerce(request.query['json'] as string) !== 'boolean') {
      const validationError = new Multi(
        `Errors during the schema validation process`,
        request.uuid,
        { name: 'ValidationError' }
      );
      const jsonFormatError = new Crash(
        `Should be a boolean - Path: [/json] - Value: [${request.query['json']}]`,
        request.uuid,
        { name: 'ValidationError' }
      );
      validationError.push(jsonFormatError);
      next(validationError);
    } else {
      next();
    }
  }
}
