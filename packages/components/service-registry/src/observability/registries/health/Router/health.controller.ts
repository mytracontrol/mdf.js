/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { NextFunction, Request, Response } from 'express';
import { Service } from './health.service';

/** Controller class */
export class Controller {
  /**
   * Create an instance of Controller class
   * @param service - service instance
   */
  constructor(private readonly service: Service) {}
  /**
   * Return the state of all the providers
   * @param request - HTTP request express object
   * @param response - HTTP response express object
   * @param next - Next express middleware function
   */
  public health(request: Request, response: Response, next: NextFunction): void {
    this.service
      .health()
      .then(result => {
        response.status(200).json(result);
      })
      .catch(next);
  }
}
