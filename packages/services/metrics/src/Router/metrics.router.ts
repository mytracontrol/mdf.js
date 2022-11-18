/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import express from 'express';
import { Aggregator } from '../Aggregator';
import { Controller } from './metrics.controller';
import { Model } from './metrics.model';
import { Service } from './metrics.service';
import { Validator } from './metrics.validator';

const PREFIX_PATH = '/metrics';

/** Router class */
export class Router {
  readonly #router: express.Router;
  /** Aggregator used by this model */
  readonly #aggregator: Aggregator;
  /** Model class instance */
  readonly #model: Model;
  /** Service class instance */
  readonly #service: Service;
  /** Controller class instance */
  readonly #controller: Controller;
  /** Validator class instance */
  readonly #validator: Validator;
  /**
   * Create a new instance of the Router class
   * @param aggregator - Aggregator used by this component
   * @param isCluster - indicates that the instance of this metrics service is running in a cluster
   * @param path - prefix path for all the routes
   */
  constructor(aggregator: Aggregator, isCluster = false, path = PREFIX_PATH) {
    this.#aggregator = aggregator;
    this.#model = new Model(this.#aggregator);
    this.#service = new Service(this.#model);
    this.#controller = new Controller(this.#service, isCluster);
    this.#validator = new Validator();
    this.#router = this.buildRoutes(path);
  }
  /**
   * Perform the instantiation of the routes in an express router
   * @param path - prefix path for all the routers
   */
  private buildRoutes(path: string): express.Router {
    const router = express.Router();
    router
      .route(path)
      .get(
        this.#validator.metrics.bind(this.#validator),
        this.#controller.metrics.bind(this.#controller)
      );
    return router;
  }
  /** Express router for health REST API component*/
  get router(): express.Router {
    return this.#router;
  }
}
