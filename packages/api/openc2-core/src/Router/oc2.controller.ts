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
