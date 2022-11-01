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
export class NoCache {
  /** Request cache middleware handler */
  public static handler(): RequestHandler {
    return new NoCache().handler;
  }
  /** Request cache middleware handler */
  private handler = (req: Request, res: Response, next: NextFunction): void => {
    if (res.getHeader('Cache-Control') === undefined) {
      res.setHeader('Surrogate-Control', 'no-store');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '-1');
    }
    next();
  };
}
