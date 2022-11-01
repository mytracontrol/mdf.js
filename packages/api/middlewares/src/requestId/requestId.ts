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

import { NextFunction, Request, RequestHandler, Response } from 'express';
import { v4 } from 'uuid';

export class RequestId {
  /** Request traceability middleware handler */
  public static handler(): RequestHandler {
    return new RequestId().handler;
  }
  /** Request traceability middleware handler */
  private handler: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
    req.headers['X-Request-ID'] =
      req.headers['X-Request-ID'] || req.headers['x-request-id'] || v4();
    req['uuid'] = req.headers['X-Request-ID'] as string;
    next();
  };
}
