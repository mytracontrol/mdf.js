/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import express from 'express';
import { Registry } from '../Registries';
import { Controller } from './health.controller';
import { Model } from './health.model';
import { Service } from './health.service';

const PREFIX_PATH = '/health';

/** Router class */
export class Router {
  readonly #router: express.Router;
  /** Registry used by this model */
  readonly #registry: Registry;
  /** Model class instance */
  readonly #model: Model;
  /** Service class instance */
  readonly #service: Service;
  /** Controller class instance */
  readonly #controller: Controller;
  /**
   * Create a new instance of the Router class
   * @param registry - Registry used by this component
   * @param path - prefix path for all the routes
   */
  constructor(registry: Registry, path = PREFIX_PATH) {
    this.#registry = registry;
    this.#model = new Model(this.#registry);
    this.#service = new Service(this.#model);
    this.#controller = new Controller(this.#service);
    this.#router = this.buildRoutes(path);
  }
  /**
   * Perform the instantiation of the routes in an express router
   * @param path - prefix path for all the routers
   */
  private buildRoutes(path: string): express.Router {
    const router = express.Router();
    router.route(path).get(this.#controller.health.bind(this.#controller));
    return router;
  }
  /** Express router for health REST API component*/
  get router(): express.Router {
    return this.#router;
  }
}
