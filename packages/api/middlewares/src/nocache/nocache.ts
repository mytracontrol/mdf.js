/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { NextFunction, Request, RequestHandler, Response } from 'express';
export class NoCache {
  /** Request cache middleware handler */
  public static handler(): RequestHandler {
    return new NoCache().handler;
  }
  /** Request cache middleware handler */
  private readonly handler = (req: Request, res: Response, next: NextFunction): void => {
    if (res.getHeader('Cache-Control') === undefined) {
      res.setHeader('Surrogate-Control', 'no-store');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '-1');
    }
    next();
  };
}
