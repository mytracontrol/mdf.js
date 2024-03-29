/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import express from 'express';
import { ConfigManager } from '../ConfigManager';
import { Controller } from './config.controller';
import { Model } from './config.model';
import { Service } from './config.service';

const PREFIX_PATH = '/config';

/** Router class */
export class Router {
  private readonly _router: express.Router;
  /** Model class instance */
  private readonly model: Model;
  /** Service class instance */
  private readonly service: Service;
  /** Controller class instance */
  private readonly controller: Controller;
  /**
   * Create a new instance of the Router class
   * @param manager - Registry used by this component
   * @param path - prefix path for all the routes
   */
  constructor(private readonly manager: ConfigManager, path = PREFIX_PATH) {
    this.manager = manager;
    this.model = new Model(this.manager);
    this.service = new Service(this.model);
    this.controller = new Controller(this.service);
    this._router = this.buildRoutes(path);
  }
  /**
   * Perform the instantiation of the routes in an express router
   * @param path - prefix path for all the routers
   */
  private buildRoutes(path: string): express.Router {
    const router = express.Router();
    router.route(`${path}/readme`).get(this.controller.readme.bind(this.controller));
    router.route(`${path}/:id`).get(this.controller.query.bind(this.controller));
    return router;
  }
  /** Express router for health REST API component*/
  get router(): express.Router {
    return this._router;
  }
}
