/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { deCycle } from '@mdf.js/utils';
import { NextFunction, Request, Response } from 'express';
import { Service } from './registry.service';

/** Controller class */
export class Controller {
  /**
   * Create an instance of Controller class
   * @param service - service instance
   */
  constructor(private readonly service: Service) {}
  /**
   * Get all the error in the registry
   * @param request - HTTP request express object
   * @param response - HTTP response express object
   * @param next - Next express middleware function
   */
  public errors(request: Request, response: Response, next: NextFunction): void {
    const errors = this.service.errors();
    if (errors.length !== 0) {
      response.status(200).json(deCycle(errors));
    } else {
      response.status(204).send();
    }
  }
}
