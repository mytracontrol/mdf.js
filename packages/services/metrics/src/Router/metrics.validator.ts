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
