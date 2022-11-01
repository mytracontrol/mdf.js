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

import express from 'express';
import { Registry } from '../modules';
import { Controller } from './oc2.controller';
import { Model } from './oc2.model';
import { Service } from './oc2.service';

const PREFIX_PATH = '/openC2';

/** Router class */
export class Router {
  public readonly router: express.Router;
  /** Model class instance */
  private readonly model: Model;
  /** Service class instance */
  private readonly service: Service;
  /** Controller class instance */
  private readonly controller: Controller;
  /**
   * Create a new instance of the Router class
   * @param register - Register used by this component
   * @param path - prefix path for all the routes
   */
  constructor(register: Registry, path = PREFIX_PATH) {
    this.model = new Model(register);
    this.service = new Service(this.model);
    this.controller = new Controller(this.service);
    this.router = this.buildRoutes(path);
  }
  /**
   * Perform the instantiation of the routes in an express router
   * @param path - prefix path for all the routers
   */
  private buildRoutes(path: string): express.Router {
    const router = express.Router();
    router.route(`${path}/:id`).get(this.controller.query.bind(this.controller));
    return router;
  }
}
