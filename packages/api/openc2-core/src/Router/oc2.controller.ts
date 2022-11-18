/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { BoomHelpers } from '@mdf.js/crash';
import { NextFunction, Request, Response } from 'express';
import { Service } from './oc2.service';

/** Controller class */
export class Controller {
  /**
   * Create an instance of Controller class
   * @param service - service instance
   */
  constructor(private readonly service: Service) {}
  /**
   * Return array of messages used as fifo registry
   * @param request - HTTP request express object
   * @param response - HTTP response express object
   * @param next - Next express middleware function
   */
  public query(request: Request, response: Response, next: NextFunction): void {
    let selector: Promise<any[]> | undefined;
    const param = request.params['id'];
    switch (param) {
      case 'jobs':
        selector = this.service.jobs();
        break;
      case 'messages':
        selector = this.service.messages();
        break;
      case 'pendingJobs':
        selector = this.service.pendingJobs();
        break;
      default:
        selector = undefined;
    }
    if (!selector) {
      next(BoomHelpers.badRequest(`Invalid parameter ${param}`, request.uuid));
    } else {
      selector
        .then(result => {
          if (result.length > 0) {
            response.status(200).json(result);
          } else {
            response.status(204).send();
          }
        })
        .catch(next);
    }
  }
}
