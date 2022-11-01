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
import { Health } from '@mdf/core';
import { Crash } from '@mdf/crash';
import { overallStatus } from '@mdf/utils';
import { EventEmitter } from 'events';
import { v4 } from 'uuid';

export class HealthWrapper extends EventEmitter implements Health.Component {
  /** Component identification */
  public readonly componentId = v4();
  /** Flag to indicate that an unhealthy status has been emitted recently */
  private lastStatusEmitted?: Health.API.Status;
  /**
   * Regular OpenC2 consumer implementation. This class allows the management of incoming command
   * and the underlayer Adapter. The main task of this class is to filter incoming commands that are
   * not related with the instance or are not supported
   * @param name - Component name used as node identifier for OpenC2
   * @param components - Health components to be monitored
   */
  constructor(public readonly name: string, private readonly components: Health.Component[]) {
    super();
    for (const component of this.components) {
      component.on('status', this.emitStatus.bind(this));
      component.on('error', this.onErrorHandler.bind(this));
    }
  }
  /**
   * Add a new component to health wrapper
   * @param component - component to be added to the health wrapper
   */
  public add(component: Health.Component): void {
    this.components.push(component);
    component.on('status', this.emitStatus.bind(this));
    component.on('error', this.onErrorHandler.bind(this));
    this.emitStatus();
  }
  /**
   * Return the status of the Consumer in a standard format
   * @returns _check object_ as defined in the draft standard
   * https://datatracker.ietf.org/doc/html/draft-inadarei-api-health-check-05
   */
  public get checks(): Health.API.Checks {
    return this.components.reduce((checks, component) => {
      return { ...checks, ...component.checks };
    }, {} as Health.API.Checks);
  }
  /** Emit the status if it's different from the last emitted status */
  private emitStatus(): void {
    const actualStatus = overallStatus(this.checks);
    if (this.lastStatusEmitted !== actualStatus) {
      this.lastStatusEmitted = this.overallStatus;
      this.emit('status', this.overallStatus);
    }
  }
  /**
   * Manage the error in the producer interface
   * @param error - error to be processed
   */
  private onErrorHandler(error: unknown): void {
    const crash = Crash.from(error);
    if (this.listenerCount('error') > 0) {
      this.emit('error', crash);
    }
  }
  /** Overall component status */
  private get overallStatus(): Health.API.Status {
    return overallStatus(this.checks);
  }
}
