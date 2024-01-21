/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Health } from '@mdf.js/core';
import { Crash } from '@mdf.js/crash';
import EventEmitter from 'events';
import { merge } from 'lodash';
import { v4 } from 'uuid';

export class Aggregator extends EventEmitter {
  /** Instance unique identifier for trace purposes */
  public readonly componentId: string = v4();
  /** Components monitored by the aggregator */
  private readonly components: Map<string, Health.Component> = new Map();
  /** External checks, included in the aggregator to be exposed in the overall diagnostic */
  private readonly externalChecks: Map<string, Health.Check[]> = new Map();
  /** Create an instance of the Health aggregator */
  constructor() {
    super();
  }
  /** Overall component status */
  get status(): Health.Status {
    return Health.overallStatus(this.checks);
  }
  /** Aggregation of all components checks, plus external checks */
  get checks(): Health.Checks {
    let checks: Health.Checks = {};
    for (const [, components] of this.components) {
      checks = merge(checks, components.checks);
    }
    for (const [key, externalChecks] of this.externalChecks.entries()) {
      checks = merge(checks, { [key]: externalChecks });
    }
    return checks;
  }
  /**
   * Register new components to be monitored
   * @param component - component to be registered
   */
  public register(component: Health.Component | Health.Component[]): void {
    if (Array.isArray(component)) {
      for (const entry of component) {
        this._register(entry);
      }
    } else {
      this._register(component);
    }
  }
  /**
   * Update or add a check measure.
   * This should be used to inform about the state of resources behind the Component/Microservice,
   * for example states of connections with field devices.
   *
   * The new check will be taking into account in the overall health status.
   * The new check will be included in the `checks` object with the key "component:measure".
   * If this key already exists, the `componentId` of the `check` parameter will be checked, if
   * there is a check with the same `componentId` in the array, the check will be updated, in other
   * case the new check will be added to the existing array.
   *
   * The maximum number external checks is 100
   * @param component - component identification
   * @param measure - measure identification
   * @param check - check to be updated or included
   * @returns true, if the check has been updated
   */
  public addCheck(component: string, measure: string, check: Health.Check): boolean {
    if (
      (check.status && !Health.STATUS.includes(check.status)) ||
      typeof check.componentId !== 'string' ||
      this.externalChecks.size >= 100
    ) {
      return false;
    }
    const checks = this.externalChecks.get(`${component}:${measure}`) || [];
    const entryIndex = checks.findIndex(entry => entry.componentId === check.componentId);
    if (entryIndex === -1) {
      checks.push(check);
    } else {
      checks[entryIndex] = check;
    }
    this.externalChecks.set(`${component}:${measure}`, checks);
    return true;
  }
  /**
   * Return an error handler wrapping function for error event
   * @param name - component name
   */
  private readonly errorEventHandler = (subject: string): ((error: Crash | Error) => void) => {
    return (rawError: Crash | Error): void => {
      const error = Crash.from(rawError);
      error.subject = error.subject === 'common' ? subject : error.subject;
      if (this.listenerCount('error') > 0) {
        this.emit('error', error);
      }
    };
  };
  /**
   * Event handler for error event
   * @param error - Error triggered by the component
   */
  private readonly statusEventHandler = (): void => {
    if (this.listenerCount('status') > 0) {
      this.emit('status', this.status);
    }
  };
  /**
   * Register a new subcomponent to be monitored
   * @param component - subcomponent to be registered
   */
  private readonly _register = (component: Health.Component): void => {
    if (!this.components.has(component.name)) {
      component.on('error', this.errorEventHandler(component.name));
      component.on('status', this.statusEventHandler);
      this.components.set(component.name, component);
      //@ts-ignore - if the property exists, it's okey to use it
      if ('error' in component && component.error instanceof Error) {
        //@ts-ignore - if the property exists, it's okey to use it
        this.errorEventHandler(component.name)(component.error);
      }
    }
  };
}
