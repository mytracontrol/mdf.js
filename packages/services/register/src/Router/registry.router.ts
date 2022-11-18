/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import express from 'express';
import { Registry } from '../Registries';
import { Controller } from './registry.controller';
import { Model } from './registry.model';
import { Service } from './registry.service';

const PREFIX_PATH = '/registers';

/** Router class */
export class Router {
  readonly #router: express.Router;
  /** Persistence used by this model */
  readonly #persistence: Registry;
  /** Model class instance */
  readonly #model: Model;
  /** Service class instance */
  readonly #service: Service;
  /** Controller class instance */
  readonly #controller: Controller;
  /**
   * Create a new instance of the Router class
   * @param persistence - persistence instance
   * @param path - prefix path for all the routes
   */
  constructor(persistence: Registry, path = PREFIX_PATH) {
    this.#persistence = persistence;
    this.#model = new Model(this.#persistence);
    this.#service = new Service(this.#model);
    this.#controller = new Controller(this.#service);
    this.#router = this.buildRoutes(path);
  }
  /**
   * Perform the instantiation of the routes in an express router
   * @param path - prefix path for all the routers
   */
  private buildRoutes(registersPath: string): express.Router {
    const router = express.Router();
    router.route(registersPath).get(this.#controller.errors.bind(this.#controller));
    return router;
  }
  /** Express router for health REST API component*/
  get router(): express.Router {
    return this.#router;
  }
}
