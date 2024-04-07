/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Health, Layer } from '@mdf.js/core';
import { Crash } from '@mdf.js/crash';
import { EventEmitter } from 'events';
import { v4 } from 'uuid';

export class HealthWrapper extends EventEmitter implements Layer.App.Resource {
  /** Component identification */
  public readonly componentId = v4();
  /** Flag to indicate that an unhealthy status has been emitted recently */
  private lastStatusEmitted?: Health.Status;
  /**
   * Regular OpenC2 consumer implementation. This class allows the management of incoming command
   * and the underlayer Adapter. The main task of this class is to filter incoming commands that are
   * not related with the instance or are not supported
   * @param name - Component name used as node identifier for OpenC2
   * @param components - Health components to be monitored
   */
  constructor(
    public readonly name: string,
    private readonly components: Layer.App.Resource[]
  ) {
    super();
    for (const component of this.components) {
      component.on('status', this.emitStatus);
      component.on('error', this.onErrorHandler);
    }
  }
  /**
   * Add a new component to health wrapper
   * @param component - component to be added to the health wrapper
   */
  public add(component: Layer.App.Resource): void {
    this.components.push(component);
    component.on('status', this.emitStatus);
    component.on('error', this.onErrorHandler);
    this.emitStatus();
  }
  /**
   * Return the status of the Consumer in a standard format
   * @returns _check object_ as defined in the draft standard
   * https://datatracker.ietf.org/doc/html/draft-inadarei-api-health-check-05
   */
  public get checks(): Health.Checks {
    return this.components.reduce((checks, component) => {
      return { ...checks, ...component.checks };
    }, {} as Health.Checks);
  }
  /** Emit the status if it's different from the last emitted status */
  private readonly emitStatus = (): void => {
    const actualStatus = Health.overallStatus(this.checks);
    if (this.lastStatusEmitted !== actualStatus) {
      this.lastStatusEmitted = this.status;
      this.emit('status', this.status);
    }
  };
  /**
   * Manage the error in the producer interface
   * @param error - error to be processed
   */
  private readonly onErrorHandler = (error: unknown): void => {
    const crash = Crash.from(error);
    if (this.listenerCount('error') > 0) {
      this.emit('error', crash);
    }
  };
  /** Overall component status */
  public get status(): Health.Status {
    return Health.overallStatus(this.checks);
  }
  /** Fake start method used to implement the Resource interface */
  public async start(): Promise<void> {
    return Promise.resolve();
  }
  /** Fake stop method used to implement the Resource interface */
  public async stop(): Promise<void> {
    return Promise.resolve();
  }
  /** Fake close method used to implement the Resource interface */
  public async close(): Promise<void> {
    return Promise.resolve();
  }
}
