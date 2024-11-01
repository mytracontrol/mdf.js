/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Health, type Layer } from '@mdf.js/core';
import { Crash } from '@mdf.js/crash';
import { DebugLogger, SetContext, type LoggerInstance } from '@mdf.js/logger';
import EventEmitter from 'events';
import { merge } from 'lodash';
import { v4 } from 'uuid';
import { Engine } from './engine';
import { Keygen } from './keygen';
import { DEFAULT_FILE_FLINGER_OPTIONS, type FileFlingerOptions } from './types';
import { Watcher } from './watcher';

/**
 * FileFlinger class
 * Allows to create a file processing service that can be used to watch a folder for new files and
 * send them to a destination (S3, FTP, ...) using pushers.
 * The service can be configured with a pattern to match the file names and generate keys for the
 * destination.
 * Once a file is processed, it can be moved to an archive folder (zipped optionally) or deleted.
 * As a @mdf.js service, it offer prometheus metrics, health checks, and logging.
 */
export class FileFlinger extends EventEmitter implements Layer.App.Service {
  /** Debug logger for development and deep troubleshooting */
  private readonly logger: LoggerInstance;
  /** The component identifier */
  public readonly componentId: string = v4();
  /** The options to create the FileFlinger */
  private readonly options: FileFlingerOptions;
  /** The key generator to generate keys for the files */
  private readonly keygen: Keygen;
  /** The watcher instance */
  private readonly watcher: Watcher;
  /** Engine instance */
  private readonly engine: Engine;
  /**
   * Create a new instance of the FileFlinger with the given options
   * @param name - The name of the instance of the FileFlinger
   * @param options - The options to create the FileFlinger
   */
  constructor(
    public readonly name: string,
    options: FileFlingerOptions
  ) {
    super();
    this.options = merge({}, DEFAULT_FILE_FLINGER_OPTIONS, options);
    // Stryker disable next-line all
    this.logger = SetContext(
      this.options?.logger || new DebugLogger(`mdf:fileFlinger:${this.name}`),
      this.name,
      this.componentId
    );
    if (typeof this.options.watchPath !== 'string' && !Array.isArray(this.options.watchPath)) {
      throw new Crash(`FileFlinger must have a valid watch path`, this.componentId);
    }
    this.watcher = new Watcher(
      { ...this.options, componentId: this.componentId, name: this.name },
      this.logger
    );
    this.keygen = new Keygen(this.options, this.logger);
    this.engine = new Engine(
      this.keygen,
      { ...this.options, componentId: this.componentId, name: this.name },
      this.logger
    );
  }
  /** Add event handler for new files */
  private readonly onAddEventHandler = (path: string) => {
    // Stryker disable next-line all
    this.logger.info(`New file detected: ${path}`);
    this.engine.processFile(path);
  };
  /** Pusher/Watcher event handlers */
  private readonly onErrorEventHandler = (error: Error | Crash) => {
    // Stryker disable next-line all
    this.logger.error(`${error.message}`);
    if (this.listenerCount('error') > 0) {
      this.emit('error', error);
    }
  };
  /** Perform the subscription to the events from pushers and watchers */
  private wrappingEvents(): void {
    this.watcher.on('error', this.onErrorEventHandler);
    this.watcher.on('add', this.onAddEventHandler);
    this.engine.on('error', this.onErrorEventHandler);
  }
  /** Perform the unsubscription to the events from pushers and watchers */
  private unwrappingEvents(): void {
    this.watcher.off('error', this.onErrorEventHandler);
    this.watcher.off('add', this.onAddEventHandler);
    this.engine.off('error', this.onErrorEventHandler);
  }
  /** Start the file flinger */
  public async start(): Promise<void> {
    this.wrappingEvents();
    await this.engine.start();
    await this.watcher.start();
  }
  /** Stop the file flinger */
  public async stop(): Promise<void> {
    this.unwrappingEvents();
    await this.watcher.stop();
    await this.engine.stop();
  }
  /** Close the file flinger */
  public async close(): Promise<void> {
    await this.stop();
    await this.watcher.close();
    await this.engine.close();
  }
  /** Overall component status */
  public get status(): Health.Status {
    return Health.overallStatus(this.checks);
  }
  /**
   * Return the status of the file-flinger in a standard format
   * @returns _check object_ as defined in the draft standard
   * https://datatracker.ietf.org/doc/html/draft-inadarei-api-health-check-05
   */
  public get checks(): Health.Checks {
    return { ...this.watcher.checks, ...this.engine.checks };
  }
}
