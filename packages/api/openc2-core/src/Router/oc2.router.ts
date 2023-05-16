/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import EventEmitter from 'events';
import express from 'express';
import { Registry } from '../modules';
import { Control } from '../types';
import { Controller } from './oc2.controller';
import { Model } from './oc2.model';
import { CommandResponseHandler, Service } from './oc2.service';

const PREFIX_PATH = '/openC2';

export declare interface Router {
  /** Event emitted when a command is received */
  on(
    event: 'command',
    listener: (message: Control.CommandMessage, done: CommandResponseHandler) => void
  ): this;
}

/** Router class */
export class Router extends EventEmitter {
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
    super();
    this.model = new Model(register);
    this.service = new Service(this.model);
    this.controller = new Controller(this.service);
    this.router = this.buildRoutes(path);
    this.service.on('command', this.onCommand);
  }
  /**
   * Event handler for the command event
   * @param message - message to be processed
   * @param done - callback to be called when the command is processed
   */
  private readonly onCommand = (message: Control.CommandMessage, done: CommandResponseHandler) => {
    this.emit('command', message, done);
  };
  /**
   * Perform the instantiation of the routes in an express router
   * @param path - prefix path for all the routers
   */
  private buildRoutes(path: string): express.Router {
    const router = express.Router();
    router.route(`${path}/command`).post(this.controller.command.bind(this.controller));
    router.route(`${path}/:id`).get(this.controller.query.bind(this.controller));
    return router;
  }
}
