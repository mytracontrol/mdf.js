/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Layer } from '@mdf.js/core';
import { Crash } from '@mdf.js/crash';
import { LoggerInstance } from '@mdf.js/logger';
import EventEmitter from 'events';
import {
  DEFAULT_CONFIG_REGISTER_INCLUDE_STACK,
  DEFAULT_CONFIG_REGISTER_MAX_LIST_SIZE,
  ErrorRecord,
  HandleableError,
} from '../types';

/**
 * The Aggregator class is responsible for aggregating and managing error events
 * from various components within an application. It allows for centralized error
 * handling, supporting a structured approach to error logging and potentially
 * error recovery strategies.
 *
 * It extends EventEmitter to emit error events, enabling other parts of the
 * application to listen and respond to these error events as needed.
 */
export class Aggregator extends EventEmitter {
  /** Hold registered errors */
  private _errors: ErrorRecord[] = [];
  /** Hold registered errors from workers */
  private _workersErrors: ErrorRecord[] = [];
  /** Timestamp of the last update */
  private _lastUpdate: string = new Date().toISOString();
  /** Map to keep track of registered components */
  private readonly components: Map<string, Layer.Observable> = new Map();
  /**
   * Creates an instance of Aggregator.
   * @param logger - Logger instance for logging error registration and handling.
   * @param maxSize - Maximum number of errors to keep in the registry. Older errors are removed as
   * new ones are added.
   * @param includeStack - Flag to determine if stack traces should be included in the error
   * records.
   */
  constructor(
    private readonly logger: LoggerInstance,
    protected readonly maxSize: number = DEFAULT_CONFIG_REGISTER_MAX_LIST_SIZE,
    protected readonly includeStack: boolean = DEFAULT_CONFIG_REGISTER_INCLUDE_STACK
  ) {
    super();
    // Stryker disable next-line all
    this.logger.debug(
      `New error aggregator instance created: ${JSON.stringify({ maxSize, includeStack })}`
    );
    if (maxSize < 1) {
      this.maxSize = DEFAULT_CONFIG_REGISTER_MAX_LIST_SIZE; // Ensure maxSize is at least 1
      // Stryker disable next-line all
      this.logger.warn(
        `Error aggregator maxSize must be greater than 0. Defaulting to ${DEFAULT_CONFIG_REGISTER_MAX_LIST_SIZE}`
      );
    }
  }
  /**
   * Register a component or a list of components to monitor for errors.
   * @param component - Component or list of components to be registered
   */
  public register(component: Layer.Observable | Layer.Observable[]): void {
    const _components = Array.isArray(component) ? component : [component];
    for (const entry of _components) {
      if (this.isValidComponent(entry) && !this.components.has(entry.name)) {
        // Stryker disable next-line all
        this.logger.debug(`Registering error handler for component: ${entry.name}`);
        entry.on('error', this.errorEventHandler(entry.name)); // Attach error handler
        this.components.set(entry.name, entry);
        if ('error' in entry && entry.error instanceof Error) {
          // Stryker disable next-line all
          this.logger.debug(`Registering pre-existing error from component: ${entry.name}`);
          this.errorEventHandler(entry.name)(entry.error); // Register pre-existing error
        }
      }
    }
  }
  /**
   * Adds an error to the registry, converting it to a structured format.
   * @param error - The error to register.
   */
  public push(error: HandleableError): void {
    const validatedError = Crash.from(error); // Convert to Crash instance
    let errorRecord: ErrorRecord;
    if (this.includeStack) {
      errorRecord = {
        ...validatedError.toJSON(),
        stack: validatedError.fullStack(), // Include full stack trace
      };
    } else {
      errorRecord = validatedError.toJSON();
    }
    this._errors.push(errorRecord); // Add error to registry
    if (this._errors.length > this.maxSize) {
      this._errors.shift(); // Remove oldest error if registry is full
    }
    this._lastUpdate = new Date().toISOString(); // Update last update timestamp
    // Stryker disable next-line all
    this.logger.debug(`Error registered: ${errorRecord.uuid}`);
    if (this.listenerCount('error') > 0) {
      this.emit('error', error); // Emit error event
    }
  }
  /**
   * Updates the registry with errors from worker threads/processes.
   * @param errors - Array of errors from workers.
   */
  public updateWorkersErrors(errors: ErrorRecord[]): void {
    this._workersErrors = errors;
    this._lastUpdate = new Date().toISOString(); // Update last update timestamp
    // Stryker disable next-line all
    this.logger.debug(`Worker errors updated: ${JSON.stringify(errors)}`);
  }
  /** @returns Last update date */
  public get lastUpdate(): string {
    return this._lastUpdate;
  }
  /** @returns Returns a combined list of all the registered errors */
  public get errors(): ErrorRecord[] {
    return [...this._errors, ...this._workersErrors];
  }
  /** @returns The current number of registered errors */
  public get size(): number {
    return this._errors.length + this._workersErrors.length;
  }
  /** Clear the error registry */
  public clear(): void {
    this._errors = [];
  }
  /** Cleans up by removing error event listeners and clearing the registry. */
  public close(): void {
    for (const [, component] of this.components) {
      component.off('error', this.errorEventHandler(component.name));
      // Stryker disable next-line all
      this.logger.debug(`Error handler removed for component: ${component.name}`);
    }
    this.components.clear();
    this.clear();
    // Stryker disable next-line all
    this.logger.debug('Error aggregator closed');
  }
  /**
   * Generates an error handling function for a specific component.
   * @param subject - The name of the component.
   * @returns A function that takes an error, converts it, and adds it to the registry.
   */
  private readonly errorEventHandler = (subject: string): ((error: Crash | Error) => void) => {
    return (rawError: Crash | Error): void => {
      const error = Crash.from(rawError);
      error.subject = error.subject === 'common' ? subject : error.subject;
      this.push(error);
    };
  };
  /** Check if the check is valid to be monitored */
  private isValidComponent(component: Layer.Observable): boolean {
    return 'name' in component && 'on' in component && 'off' in component;
  }
}
