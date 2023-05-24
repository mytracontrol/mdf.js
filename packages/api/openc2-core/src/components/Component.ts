/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Health, Layer } from '@mdf.js/core';
import { Crash, Links } from '@mdf.js/crash';
import { DebugLogger, LoggerInstance, SetContext } from '@mdf.js/logger';
import EventEmitter from 'events';
import express from 'express';
import { v4 } from 'uuid';
import { Router } from '../Router';
import { HealthWrapper, Registry } from '../modules';
import { ComponentAdapter, ComponentOptions } from '../types';

export declare interface Component<T, K> {
  /** Emitted when a producer's operation has some problem */
  on(event: 'error', listener: (error: Crash | Error) => void): this;
  /** Emitted on every state change */
  on(event: 'status', listener: (status: Health.Status) => void): this;
}

export abstract class Component<T extends ComponentAdapter, K extends ComponentOptions>
  extends EventEmitter
  implements Health.Component, Layer.Service.Registry
{
  /** Component identification */
  public readonly componentId: string = v4();
  /** Component commands and message register */
  protected readonly register: Registry;
  /** Registry router */
  protected readonly _router: Router;
  /** Logger instance */
  protected readonly logger: LoggerInstance;
  /** Health wrapper instance */
  protected readonly health: HealthWrapper;
  /** Component started flag */
  private started: boolean;
  /**
   * Abstract OpenC2 component implementation.
   * @param adapter - transport adapter
   * @param options - configuration options
   */
  constructor(protected readonly adapter: T, protected options: K) {
    super();
    this.logger = SetContext(
      this.options.logger ?? new DebugLogger(`mdf:oc2:component:${this.name}`),
      this.constructor.name,
      this.componentId
    );
    this.register =
      this.options.registry ??
      new Registry(this.options.id, this.options.maxInactivityTime, this.options.registerLimit);
    this._router = new Router(this.register);
    this.health = new HealthWrapper(this.options.id, [this.register, this.adapter]);
    this.started = false;
  }
  /** Component name */
  public get name(): string {
    return this.options.id;
  }
  /**
   * Return the status of the Consumer in a standard format
   * @returns _check object_ as defined in the draft standard
   * https://datatracker.ietf.org/doc/html/draft-inadarei-api-health-check-05
   */
  public get checks(): Health.Checks {
    return this.health.checks;
  }
  /** Return an Express router with access to OpenC2 information */
  public get router(): express.Router {
    return this._router.router;
  }
  /** Return links offered by this service */
  public get links(): Links {
    return {
      openc2: {
        jobs: '/openc2/jobs',
        pendingJobs: '/openc2/pendingJobs',
        messages: '/openc2/messages',
      },
    };
  }
  /**
   * Manage the error in the producer interface
   * @param error - error to be processed
   */
  protected readonly onErrorHandler = (error: unknown): void => {
    const crash = Crash.from(error);
    this.logger.crash(crash);
    if (this.listenerCount('error') > 0) {
      this.emit('error', crash);
    }
  };
  /**
   * Manage the status change in the producer interface
   * @param status - status to be processed
   */
  private readonly onStatusHandler = (status: Health.Status): void => {
    if (this.listenerCount('status') > 0) {
      this.emit('status', status);
    }
  };
  /**
   * Connect the OpenC2 Adapter to the underlayer transport system and perform the startup of the
   * component
   */
  public start(): Promise<void> {
    if (this.started) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      this.adapter
        .start()
        .then(() => this.startup())
        .then(() => {
          this.health.on('error', this.onErrorHandler);
          this.health.on('status', this.onStatusHandler);
        })
        .then(() => {
          this.started = true;
          resolve();
        })
        .catch(reject);
    });
  }
  /**
   * Disconnect the OpenC2 Adapter to the underlayer transport system and perform the shutdown of
   * the component
   */
  public stop(): Promise<void> {
    if (!this.started) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      this.health.off('error', this.onErrorHandler);
      this.health.off('status', this.onStatusHandler);
      this.adapter
        .stop()
        .then(() => this.shutdown())
        .then(() => {
          this.started = false;
          this.register.clear();
          resolve();
        })
        .catch(reject);
    });
  }
  /** Initialize the OpenC2 component */
  protected abstract startup(): Promise<void>;
  /** Shutdown the OpenC2 component */
  protected abstract shutdown(): Promise<void>;
}
