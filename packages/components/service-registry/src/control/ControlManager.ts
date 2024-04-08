/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash, Multi } from '@mdf.js/crash';
import { LoggerInstance } from '@mdf.js/logger';
import {
  CommandJobHandler,
  Consumer,
  ConsumerOptions,
  Control,
  Factory,
  ResolverMap,
} from '@mdf.js/openc2';
import cluster from 'cluster';
import { MergeWithCustomizer, cloneDeep, merge, mergeWith } from 'lodash';
import { EventEmitter } from 'stream';
import { ConsumerAdapterOptions, ServiceRegistryOptions } from '../types';

/**
 * Customizer function used for merging objects with `MergeWith` function.
 * @param objValue - The value from the destination object.
 * @param srcValue - The value from the source object.
 * @returns The merged value or `undefined` if no merge is needed.
 */
const customizer: MergeWithCustomizer = (objValue, srcValue) => {
  if (Array.isArray(objValue)) {
    return Array.from(new Set(objValue.concat(srcValue)).values());
  }
  return undefined;
};

/**
 * ControlManager handles OpenC2 command and control interactions, serving as the bridge between
 * OpenC2 Consumers and the Service.
 * It extends EventEmitter to re-emit the events of the OpenC2 Consumer (e.g., command execution,
 * errors, and status updates).
 */
export class ControlManager extends EventEmitter {
  /** OpenC2 Consumer instance */
  public readonly instance?: Consumer;
  /** Validation error, if exist */
  private _error?: Multi;
  /**
   * Constructor for the ControlManager class.
   * @param serviceRegistrySettings - Service Registry settings, which include the consumer and
   * adapter configurations.
   * @param logger - Logger instance.
   * @param defaultResolver - This is the default resolver map for the OpenC2 interface, which is
   * merged with the resolver map from the service registry settings, if provided. The default
   * value, passed from the Service Registry instance include resolvers for the `features`:
   * - `query`: `health`, `stats`, `errors` and `config`
   * - `start`: `resources`
   * - `stop`: `resources`
   */
  constructor(
    private readonly serviceRegistrySettings: ServiceRegistryOptions,
    private readonly logger: LoggerInstance,
    private readonly defaultResolver?: ResolverMap
  ) {
    super();
    if (cluster.isWorker) {
      // Stryker disable next-line all
      this.logger.debug(`The OpenC2 Consumer can not be instantiated in a worker process`);
      return;
    }
    this.instance = this.initializeOpenC2Consumer();
    if (this.instance) {
      this.wrapConsumerEvents(this.instance);
    }
  }
  /**
   * Instantiates the OpenC2 Consumer instance based on the service registry settings.
   * @returns OpenC2 Consumer instance, if it was successfully instantiated.
   */
  private initializeOpenC2Consumer(): Consumer | undefined {
    const _consumerOptions = this.getConsumerOptions(
      this.serviceRegistrySettings,
      this.defaultResolver
    );
    const _adapterOptions = this.getAdapterOptions(this.serviceRegistrySettings.adapterOptions);
    if (_consumerOptions) {
      if (_adapterOptions && _adapterOptions.type === 'socketIO') {
        // Stryker disable next-line all
        this.logger.info(
          `A OpenC2 Consumer [${_consumerOptions.id}] based on SocketIO is going to be instantiated.`
        );
        return Factory.Consumer.SocketIO(_consumerOptions, _adapterOptions.config);
      } else if (_adapterOptions && _adapterOptions.type === 'redis') {
        // Stryker disable next-line all
        this.logger.info(
          `A OpenC2 Consumer [${_consumerOptions.id}] based on Redis is going to be instantiated.`
        );
        return Factory.Consumer.Redis(_consumerOptions, _adapterOptions.config);
      } else {
        // Stryker disable next-line all
        this.logger.warn(
          `The OpenC2 Consumer will be instantiated with a dummy adapter, no adapter options were provided.`
        );
        return Factory.Consumer.Dummy(_consumerOptions);
      }
    } else if (this._error) {
      // Stryker disable next-line all
      this.logger.warn(
        `The OpenC2 Consumer was not instantiated due to the following errors: ${this._error.trace()}`
      );
    } else {
      // Stryker disable next-line all
      this.logger.debug(`A OpenC2 Consumer was not instantiated`);
    }
    return undefined;
  }
  /**
   * Returns the validation error, if exist.
   * @returns Multi error, if exist.
   */
  public get error(): Multi | undefined {
    return this._error;
  }
  /**
   * Checks and return a validated version of adapter options.
   * @param options - Consumer adapter options
   * @returns OpenC2 adapter options, retrieved from the service registry settings, if provided.
   */
  private getAdapterOptions(options?: ConsumerAdapterOptions): ConsumerAdapterOptions | undefined {
    let _options: ConsumerAdapterOptions | undefined;
    if (!options) {
      this.logger.warn(
        `No consumer adapter options were provided, a dummy adapter will be created`
      );
    } else if (options.type !== 'redis' && options.type !== 'socketIO') {
      this.addError(new Crash(`Unknown consumer adapter type, costumer will not be instantiated.`));
    } else {
      _options = options;
    }
    return _options;
  }
  /**
   * Checks and return a validated version of consumer options.
   * @param options - Service registry settings
   * @param defaultResolver - Default resolver map for the OpenC2 interface
   * @returns OpenC2 consumer options, retrieved from the service registry settings, if provided and
   * merged with some default options.
   */
  private getConsumerOptions(
    options: ServiceRegistryOptions,
    defaultResolver?: ResolverMap
  ): ConsumerOptions | undefined {
    const _id = options.consumerOptions?.id || options.metadata?.name;
    const _resolver = merge(defaultResolver, options.consumerOptions?.resolver);
    const _actionTargetPairs = this.getActionTargetPairs(options);
    const _logger = this.logger;
    if (!_id) {
      this.addError(
        new Crash(
          `No consumer id was provided in the service registry settings, this looks looks like an internal library error.`
        )
      );
      return undefined;
    }
    return merge(cloneDeep(options.consumerOptions), {
      id: _id,
      resolver: _resolver,
      actionTargetPairs: _actionTargetPairs,
      logger: _logger,
    });
  }
  /**
   * Constructs and merges the action-target pairs for the OpenC2 interface based on the namespace
   * and service registry settings.
   * @param options - Service registry settings
   * @returns Action-Target pairs for the OpenC2 interface, merged with the default pairs for the
   */
  private getActionTargetPairs(options: ServiceRegistryOptions): Control.ActionTargetPairs {
    let _defaultPairs: Control.ActionTargetPairs;
    // If a namespace is defined, create pairs for service control by the Service Registry
    if (options.metadata?.namespace) {
      _defaultPairs = {
        query: [
          'features',
          `${options.metadata.namespace}:health`,
          `${options.metadata.namespace}:stats`,
          `${options.metadata.namespace}:errors`,
        ],
        start: [`${options.metadata.namespace}:resources`],
        stop: [`${options.metadata.namespace}:resources`],
      };
    }
    // If action-target pairs are provided in the service registry settings, use them
    else if (options.consumerOptions?.actionTargetPairs) {
      _defaultPairs = {};
    }
    // Otherwise, use the default pairs for the OpenC2 interface
    else {
      _defaultPairs = { query: ['features'] };
    }
    return mergeWith(_defaultPairs, options.consumerOptions?.actionTargetPairs, customizer);
  }
  /**
   * Adds an error to the validation error list, creating a new Multi error if necessary. If the
   * error is a Multi error, its causes are added to the list.
   * @param error - The error to add to the validation error list.
   */
  private addError(error?: Crash | Multi | Error): void {
    if (!error) {
      return;
    }
    if (!this._error) {
      this._error = new Multi(`Error in the OpenC2 Consumer instance configuration`);
    }
    if (error instanceof Multi) {
      if (error.causes) {
        error.causes.forEach(cause => {
          this._error?.push(cause);
        });
      } else {
        this._error.push(error);
      }
    } else if (error instanceof Crash) {
      this._error.push(error);
    } else {
      this._error.push(Crash.from(error));
    }
  }
  /**
   * Event handler for the `command` event emitted by the OpenC2 Consumer instance.
   * @param command - The OpenC2 command job handler.
   * @returns void
   */
  private onCommandEvent(command: CommandJobHandler): void {
    this.logger.debug(`Received command: ${JSON.stringify(command)}`);
    this.emit('command', command);
  }
  /**
   * Wraps the OpenC2 Consumer instance events with the ControlManager event handlers.
   * @param instance - The OpenC2 Consumer instance.
   * @returns void
   */
  private wrapConsumerEvents(instance: Consumer): void {
    instance.on('command', this.onCommandEvent.bind(this));
  }
  /**
   * Starts the OpenC2 Consumer instance.
   * @returns Promise<void>
   */
  public async start(): Promise<void> {
    await this.instance?.start();
  }
  /**
   * Stops the OpenC2 Consumer instance.
   * @returns Promise<void>
   */
  public async stop(): Promise<void> {
    await this.instance?.stop();
  }
}
