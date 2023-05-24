/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { NextFunction, Request, RequestHandler, Response } from 'express';
import { v4 } from 'uuid';

const xRequestId = 'X-Request-ID';
export class RequestId {
  /** Request traceability middleware handler */
  public static handler(): RequestHandler {
    return new RequestId().handler;
  }
  /** Request traceability middleware handler */
  private readonly handler: RequestHandler = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    req.headers[xRequestId] = req.headers[xRequestId] || req.headers['x-request-id'] || v4();
    req['uuid'] = req.headers[xRequestId] as string;
    next();
  };
}
