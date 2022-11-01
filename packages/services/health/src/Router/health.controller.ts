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

import { NextFunction, Request, Response } from 'express';
import { Service } from './health.service';

/** Controller class */
export class Controller {
  /** Services used by this controller */
  readonly #service: Service;
  /**
   * Create an instance of Controller class
   * @param service - service instance
   */
  constructor(service: Service) {
    this.#service = service;
  }
  /**
   * Return the state of all the providers
   * @param request - HTTP request express object
   * @param response - HTTP response express object
   * @param next - Next express middleware function
   */
  public health(request: Request, response: Response, next: NextFunction): void {
    this.#service
      .health(request.uuid)
      .then(result => {
        response.status(200).json(result);
      })
      .catch(next);
  }
}
