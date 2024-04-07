/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Health, Layer } from '@mdf.js/core';
import { LoggerInstance } from '@mdf.js/logger';
import { prettyMS } from '@mdf.js/utils';
import EventEmitter from 'events';
import { merge, pick } from 'lodash';
import { DEFAULT_MAX_NUMBER_OF_NOTES, METADATA_PROPERTIES } from '../types';

/**
 * The Aggregator class serves as a central point for collecting and aggregating health checks
 * and statuses from various components within an application. It also allows for the integration
 * of external and worker-specific checks to provide a comprehensive view of the application's
 * health status.
 *
 * This class extends EventEmitter to emit status updates, enabling other parts of the application
 * to react to changes in health status as necessary.
 */
export class Aggregator extends EventEmitter {
  /** Components monitored by the aggregator */
  private readonly components: Map<string, Layer.App.Resource> = new Map();
  /** External checks, included in the aggregator to be exposed in the overall diagnostic */
  private readonly externalChecks: Map<string, Health.Check[]> = new Map();
  /** Worker checks, included in the aggregator to be exposed in the overall diagnostic */
  private readonly workerChecks: Map<string, Health.Check[]> = new Map();
  /** Base Health Status*/
  protected readonly baseHealth: Omit<Layer.App.Health, 'status' | 'checks'>;
  /** Array of notes to be included in the health status */
  private readonly notes: string[] = [];
  /** Public output */
  public output: string | undefined = undefined;
  /**
   * Create an instance of the Health aggregator
   * @param metadata - Metadata describing the application, used to enrich the health data.
   * @param logger - Logger instance for logging activities related to health monitoring.
   */
  constructor(
    private readonly metadata: Layer.App.Metadata,
    private readonly logger: LoggerInstance
  ) {
    super();
    this.baseHealth = {
      ...(pick(metadata, METADATA_PROPERTIES) as Layer.App.Metadata),
      notes: this.notes,
      output: this.output,
    };
    // Stryker disable next-line all
    this.logger.debug(`New health aggregator instance created: ${JSON.stringify(metadata)}`);
  }
  /**
   * Computes the health status of the application by aggregating individual component checks
   * and determining the overall status.
   */
  get health(): Layer.App.Health {
    const checks = this.checks;
    const status = Health.overallStatus(checks);
    return { ...this.baseHealth, notes: this.notes, output: this.output, status, checks };
  }
  /**
   * Aggregates checks from all sources: registered components, external checks, and worker checks.
   */
  get checks(): Health.Checks {
    let checks: Health.Checks = {};
    for (const [, components] of this.components) {
      checks = merge(checks, components.checks);
    }
    this.addWorkerCheck(this.metadata.name, 'uptime', this.uptime);
    for (const [key, _workerChecks] of this.workerChecks.entries()) {
      checks = merge(checks, { [key]: _workerChecks });
    }
    for (const [key, _externalChecks] of this.externalChecks.entries()) {
      checks = merge(checks, { [key]: _externalChecks });
    }
    return checks;
  }
  /** Overall component status */
  get status(): Health.Status {
    return Health.overallStatus(this.checks);
  }
  /**
   * Register a resource or a list of resources to monitor for errors.
   * @param component - Resource or list of resources to be registered
   */
  public register(component: Layer.App.Resource | Layer.App.Resource[]): void {
    const _components = Array.isArray(component) ? component : [component];
    for (const entry of _components) {
      if (this.isValidResource(entry) && !this.components.has(entry.name)) {
        // Stryker disable next-line all
        this.logger.debug(`Registering health handler for component: ${entry.name}`);
        entry.on('status', this.statusEventHandler);
        this.components.set(entry.name, entry);
      }
    }
  }
  /**
   * Adds a timestamped note to the health status.
   * @param note - Note to be added.
   */
  public addNote(note: string): void {
    this.notes.push(`${new Date().toISOString()} - ${note}`);
    if (this.notes.length > DEFAULT_MAX_NUMBER_OF_NOTES) {
      this.notes.shift();
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
   * The maximum number external checks entries is 10, and the maximum number of checks per entry
   * is 100.
   * @param component - component identification
   * @param measure - measure identification
   * @param check - check to be updated or included
   * @returns true, if the check has been updated or included
   */
  public addExternalCheck(component: string, measure: string, check: Health.Check): boolean {
    if (!this.isValidCheck(check)) {
      return false;
    }
    let checks = this.externalChecks.get(`${component}:${measure}`);
    if (!checks && this.externalChecks.size >= 10) {
      return false;
    } else {
      checks = checks || [];
    }
    const entryIndex = checks.findIndex(entry => entry.componentId === check.componentId);
    if (entryIndex !== -1) {
      checks[entryIndex] = check;
    } else if (this.externalChecks.size < 100) {
      checks.push(check);
    } else {
      return false;
    }
    this.externalChecks.set(`${component}:${measure}`, checks);
    return true;
  }
  /**
   * Update the health checks associated with workers.
   * @param checks - Checks to be updated or included
   */
  public updateWorkersChecks(checks: Health.Checks): void {
    for (const [key, workerChecks] of Object.entries(checks)) {
      const checks: Health.Check[] = this.workerChecks.get(key) || [];
      for (const check of workerChecks) {
        const entryIndex = checks.findIndex(entry => entry.componentId === check.componentId);
        if (entryIndex !== -1) {
          checks[entryIndex] = check;
        } else {
          checks.push(check);
        }
      }
      this.workerChecks.set(key, checks);
    }
  }
  /**
   * Update or add a check measure for a worker.
   * This should be used to inform about the state of resources behind the worker.
   * The new check will be taking into account in the overall health status.
   * The new check will be included in the `checks` object with the key "component:measure".
   * If this key already exists, the `componentId` of the `check` parameter will be checked, if
   * there is a check with the same `componentId` in the array, the check will be updated, in other
   * case the new check will be added to the existing array.
   * @param component - component identification
   * @param measure - measure identification
   * @param check - check to be updated or included
   * @returns true, if the check has been updated or included
   */
  public addWorkerCheck(component: string, measure: string, check: Health.Check): boolean {
    if (!this.isValidCheck(check)) {
      return false;
    }
    const checks = this.workerChecks.get(`${component}:${measure}`) || [];
    const entryIndex = checks.findIndex(entry => entry.componentId === check.componentId);
    if (entryIndex !== -1) {
      checks[entryIndex] = check;
    } else {
      checks.push(check);
    }
    this.workerChecks.set(`${component}:${measure}`, checks);
    return true;
  }
  /** Event handler for status event */
  private readonly statusEventHandler = (): void => {
    if (this.listenerCount('status') > 0) {
      this.emit('status', this.status);
    }
  };
  /**
   * Check if the check is valid to be included in the health status
   * @param check - Check to be validated
   * @returns
   */
  private isValidCheck(check: Health.Check): boolean {
    return (
      check.status &&
      Health.STATUSES.includes(check.status) &&
      typeof check.componentId === 'string'
    );
  }
  /** Check if the resource is valid to be monitored */
  private isValidResource(resource: Layer.App.Resource): boolean {
    return 'checks' in resource && 'on' in resource && 'off' in resource && 'name' in resource;
  }
  /** Return the the uptime of service as a check */
  private get uptime(): Health.Check {
    return {
      componentId: this.baseHealth.instanceId,
      processId: process.pid,
      componentType: 'system',
      observedValue: prettyMS(process.uptime() * 1000),
      observedUnit: 'time',
      status: Health.STATUS.PASS,
      time: new Date().toISOString(),
    };
  }
  /** Close the aggregator */
  public close(): void {
    for (const [, component] of this.components) {
      component.off('status', this.statusEventHandler);
    }
    this.components.clear();
    this.externalChecks.clear();
    this.workerChecks.clear();
    this.notes.length = 0;
    this.output = undefined;
    // Stryker disable next-line all
    this.logger.debug('Health aggregator closed');
  }
}
