/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import express from 'express';
import { Aggregator } from '../Aggregator';
import { METRICS_SERVICE_NAME } from '../types';
import { Controller } from './metrics.controller';
import { Model } from './metrics.model';
import { Service } from './metrics.service';
import { Validator } from './metrics.validator';

const PREFIX_PATH = `/${METRICS_SERVICE_NAME}`;

/** Router class */
export class Router {
  private readonly _router: express.Router;
  /** Model class instance */
  private readonly _model: Model;
  /** Service class instance */
  private readonly _service: Service;
  /** Controller class instance */
  private readonly _controller: Controller;
  /** Validator class instance */
  private readonly _validator: Validator;
  /**
   * Create a new instance of the Router class
   * @param aggregator - Aggregator used by this component
   * @param isCluster - indicates that the instance of this metrics service is running in a cluster
   * @param path - prefix path for all the routes
   */
  constructor(
    private readonly aggregator: Aggregator,
    isCluster = false,
    private readonly path = PREFIX_PATH
  ) {
    this._model = new Model(this.aggregator);
    this._service = new Service(this._model);
    this._controller = new Controller(this._service, isCluster);
    this._validator = new Validator();
    this._router = this.buildRoutes(this.path);
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
        this._validator.metrics.bind(this._validator),
        this._controller.metrics.bind(this._controller)
      );
    return router;
  }
  /** Express router for health REST API component*/
  get router(): express.Router {
    return this._router;
  }
}
