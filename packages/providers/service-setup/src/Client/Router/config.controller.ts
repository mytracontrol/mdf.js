/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { BoomHelpers } from '@mdf.js/crash';
import { NextFunction, Request, Response } from 'express';
import { Service } from './config.service';

/** Controller class */
export class Controller {
  /**
   * Create an instance of Controller class
   * @param service - service instance
   */
  constructor(private readonly service: Service) {}
  /**
   * Return the configuration objects
   * @param request - HTTP request express object
   * @param response - HTTP response express object
   * @param next - Next express middleware function
   */
  public query(request: Request, response: Response, next: NextFunction): void {
    let selector: Promise<Record<string, any>> | undefined;
    const param = request.params['id'];
    switch (param) {
      case 'presets':
        selector = this.service.presets();
        break;
      case 'config':
        selector = this.service.config();
        break;
      default:
        selector = undefined;
    }
    if (!selector) {
      next(BoomHelpers.badRequest(`Invalid parameter ${param}`, request.uuid));
    } else {
      selector
        .then(result => {
          response.status(200).json(result);
        })
        .catch(next);
    }
  }
  /**
   * Return the readme object
   * @param request - HTTP request express object
   * @param response - HTTP response express object
   * @param next - Next express middleware function
   * @returns
   */
  public readme(request: Request, response: Response, next: NextFunction): void {
    this.service
      .readme()
      .then(result => {
        if (!result) {
          response.status(204).send();
        } else {
          response.status(200).send(result);
        }
      })
      .catch(next);
  }
}
