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

import { Health } from '@mdf.js/core';
import { Crash, Multi } from '@mdf.js/crash';
import { DebugLogger, LoggerInstance } from '@mdf.js/logger';
import { EventEmitter } from 'events';
import Joi, { ValidationError } from 'joi';
import { cloneDeep, merge } from 'lodash';
import { v4 } from 'uuid';
import { ProviderOptions, ProviderState, ProviderStatus } from '../types';
import { Port } from './Port';
import { ErrorState, State, StoppedState } from './states';

type ProviderError = Multi | Crash | undefined;

/** Manager base interface */
export declare interface Manager<PortClient, PortConfig, T extends Port<PortClient, PortConfig>> {
  /** Emitted when the provider throw an error*/
  on(event: 'error', listener: (error: Crash | Error) => void): this;
  /** Emitted on every state change */
  on(event: 'status', listener: (status: Health.API.Status) => void): this;
}

export class Manager<PortClient, PortConfig, T extends Port<PortClient, PortConfig>>
  extends EventEmitter
  implements Health.Component
{
  /** Provider unique identifier for trace purposes */
  public readonly componentId: string;
  /** Debug logger*/
  private readonly logger: LoggerInstance;
  /** Error in error state */
  private _error: ProviderError;
  /** Provider actual state */
  private _state: State;
  /** Timestamp of actual state */
  private _actualStateDate: string;
  /** Port instance */
  private readonly port: T;
  /** Port configuration */
  private readonly config: PortConfig;
  /**
   * Implementation of base functionalities of a provider manager
   * @param port - Port wrapper class
   * @param config - Port configuration options
   * @param options - Manager configuration options
   */
  constructor(
    port: new (config: PortConfig, logger: LoggerInstance) => T,
    private readonly options: ProviderOptions<PortConfig>,
    config?: Partial<PortConfig>
  ) {
    super();
    this.logger = this.options.logger || new DebugLogger(this.options.name);
    this.config = this.validateConfig(config);
    try {
      this.port = new port(this.config, this.logger);
    } catch (error) {
      // Stryker disable next-line all
      this.logger.warn(`Error trying to create an instance of the port`, v4(), this.options.name);
      this.manageError(error);
      throw this._error;
    }
    this.componentId = this.port.uuid;
    this._actualStateDate = new Date().toISOString();
    if (this._error) {
      this._state = this.changeState(
        new ErrorState(this.port, this.changeState.bind(this), this.manageError.bind(this))
      );
    } else {
      this._state = this.changeState(
        new StoppedState(this.port, this.changeState.bind(this), this.manageError.bind(this))
      );
    }
  }
  /** Return the errors in the provider */
  public get error(): ProviderError {
    return this._error;
  }
  /** Provider state */
  public get state(): ProviderState {
    return this._state.state;
  }
  /**
   * Return the status of the connection in a standard format
   * @returns _check object_ as defined in the draft standard
   * https://datatracker.ietf.org/doc/html/draft-inadarei-api-health-check-05
   */
  public get checks(): Health.API.Checks {
    const checks: Health.API.Checks = {};
    for (const [measure, check] of Object.entries(this.port.checks)) {
      checks[`${this.options.name}:${measure}`] = check;
    }
    checks[`${this.options.name}:status`] = [
      {
        status: ProviderStatus[this.state],
        componentId: this.componentId,
        componentType: this.options.type,
        observedValue: this.state,
        time: this.actualStateDate,
        output: this.detailedOutput(),
      },
    ];
    return checks;
  }
  /** Port client */
  public get client(): PortClient {
    return this.port.client;
  }
  /** Provider name */
  public get name(): string {
    return this.options.name;
  }
  /** Initialize the process: internal jobs, external dependencies connections ... */
  public async start(): Promise<void> {
    return this._state.start();
  }
  /** Stop the process: internal jobs, external dependencies connections ... */
  public async stop(): Promise<void> {
    return this._state.stop();
  }
  /**
   * Error state: wait for new state of to fix the actual degraded stated
   * @param error - Cause ot this fail transition
   * @returns
   */
  public async fail(error: Crash | Error): Promise<void> {
    return this._state.fail(error);
  }
  /** Pause the process: pause internal jobs */
  public async pause(): Promise<void> {
    return this._state.pause();
  }
  /** Resume the process: resume internal jobs */
  public async resume(): Promise<void> {
    return this._state.resume();
  }
  /** Timestamp of actual state in ISO format, when the current state was reached */
  public get actualStateDate(): string {
    return this._actualStateDate;
  }
  /**
   * Change the provider state
   * @param newState - state to which it transitions
   */
  private changeState(newState: State): State {
    // Stryker disable next-line all
    this.logger.debug(`Changing state to ${newState.state}`, this.componentId, this.options.name);
    this._state = newState;
    this._actualStateDate = new Date().toISOString();
    if (this.listenerCount('status') > 0) {
      // Stryker disable all
      this.logger.debug(
        `Emitting state change event to ${this.listenerCount('status')} listeners`,
        this.componentId,
        this.options.name
      );
      // Stryker enable all
      this.emit('status', ProviderStatus[this.state]);
    }
    return newState;
  }
  /**
   * Format the error to a manageable error format
   * @param error - error to be formatted
   * @returns
   */
  private formatError(error: unknown): Multi | Crash {
    let formatError: ProviderError;
    if (error instanceof ValidationError) {
      if (
        this._error &&
        this._error instanceof Multi &&
        this._error.findCauseByName('ValidationError')
      ) {
        formatError = this._error;
      } else {
        formatError = new Multi(`Error in the provider configuration process`, this.componentId);
      }
      formatError.Multify(error);
    } else if (error instanceof Crash || error instanceof Multi) {
      formatError = error;
    } else if (error instanceof Error) {
      formatError = new Crash(error.message, this.componentId);
    } else if (typeof error === 'string') {
      formatError = new Crash(error, this.componentId);
    } else if (
      error &&
      typeof error === 'object' &&
      typeof (error as Record<string, any>)['message'] === 'string'
    ) {
      formatError = new Crash((error as Record<string, any>)['message']);
    } else {
      formatError = new Crash(
        `Unknown error in port ${this.options.name}, triggered during configuration process`,
        this.componentId
      );
    }
    return formatError;
  }
  /**
   * Manage the errors in the provider (logging, emitting, last error ...)
   * @param error - Error from wrapper instance
   */
  private manageError(error: unknown): void {
    this._error = this.formatError(error);
    // Stryker disable all
    this.logger.error(
      `New error event from provider: ${this._error.message}`,
      this.componentId,
      this.options.name
    );
    this.logger.crash(this._error, this.options.name);
    // Stryker enable all
    if (this.listenerCount('error') > 0) {
      // Stryker disable all
      this.logger.debug(
        `Emitting error event to ${this.listenerCount('error')} listeners`,
        this.componentId,
        this.options.name
      );
      // Stryker enable all
      this.emit('error', this._error);
    }
  }
  /**
   * Manage the actual stored error (last error), to create a human readable output used in the
   * observability (SubcomponentDetail)
   */
  private detailedOutput(): string | string[] | undefined {
    if (this.state === 'error' && this._error) {
      return this._error.trace();
    } else {
      return undefined;
    }
  }
  /**
   * Merge the configuration with the default values and environment values and perform the
   * validation of the new configuration against the schema
   * @param options - validation configuration options
   */
  private validateConfig(config?: Partial<PortConfig>): PortConfig {
    let baseConfig: PortConfig;
    const actualConfig = merge(
      cloneDeep(this.options.validation.defaultConfig),
      this.options.useEnvironment ? this.options.validation.envBasedConfig : undefined,
      config
    );
    try {
      baseConfig = Joi.attempt(actualConfig, this.options.validation.schema);
      // Stryker disable all
      this.logger.info(
        `Configuration has been validated properly`,
        this.componentId,
        this.options.name
      );
      // Stryker enable all
    } catch (error) {
      // Stryker disable all
      this.logger.warn(
        `Incorrect configuration, default configuration will be used`,
        this.componentId,
        this.options.name
      );
      // Stryker enable all
      this.manageError(error);
      try {
        baseConfig = Joi.attempt(
          this.options.validation.defaultConfig,
          this.options.validation.schema
        );
      } catch (defaultError) {
        // Stryker disable all
        this.logger.warn(
          `Default configuration is not valid too, nevertheless will be used ...`,
          this.componentId,
          this.options.name
        );
        // Stryker enable all
        this.manageError(defaultError);
        baseConfig = this.options.validation.defaultConfig;
      }
    }
    return baseConfig;
  }
}
