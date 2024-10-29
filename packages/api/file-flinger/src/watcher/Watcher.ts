/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Health, type Layer } from '@mdf.js/core';
import { Crash, type Multi } from '@mdf.js/crash';
import { DebugLogger, SetContext, type LoggerInstance } from '@mdf.js/logger';
import { watch, type ChokidarOptions, type FSWatcher } from 'chokidar';
import EventEmitter from 'events';
import { existsSync, statSync } from 'fs';
import { merge } from 'lodash';
import path from 'path';
import {
  DEFAULT_FS_WATCHER_OPTIONS,
  DEFAULT_WATCHER_OPTIONS,
  type InternalWatcherOptions,
  type WatcherOptions,
} from './types';

export declare interface Watcher {
  /**
   * Add a listener for the `error` event, emitted when the component detects an error.
   * @param event - `error` event
   * @param listener - Error event listener
   * @event
   */
  on(event: 'error', listener: (error: Crash | Multi | Error) => void): this;
  /**
   * Add a listener for the status event, emitted when the component status changes.
   * @param event - `status` event
   * @param listener - Status event listener
   * @event
   */
  on(event: 'status', listener: (status: Health.Status) => void): this;
  /**
   * Add a listener for the add event, emitted when a file is added.
   * @param event - `add` event
   * @param listener - Add event listener
   * @event
   */
  on(event: 'add', listener: (path: string) => void): this;
}

export class Watcher extends EventEmitter implements Layer.App.Resource {
  /** Debug logger for development and deep troubleshooting */
  private readonly logger: LoggerInstance;
  /** The options for the watcher */
  private readonly options: InternalWatcherOptions;
  /** The watcher instance */
  private watcher?: FSWatcher;
  /** The options for the chokidar watcher */
  private readonly fsWatcherOptions: ChokidarOptions;
  /** Flag to indicate if the watcher is ready */
  private ready: boolean = false;
  /** The error stack for the watcher */
  private errorStacks: string[] = [];
  /**
   * Create a new watcher instance with the given options
   * @param options - The watcher options
   * @param logger - The logger instance
   */
  constructor(options?: WatcherOptions, logger?: LoggerInstance) {
    super();
    this.options = merge({}, DEFAULT_WATCHER_OPTIONS, options);
    // Stryker disable next-line all
    this.logger = SetContext(
      logger || new DebugLogger(`mdf:fileFlinger:watcher`),
      'keygen',
      this.options.componentId
    );
    this.fsWatcherOptions = {
      ...DEFAULT_FS_WATCHER_OPTIONS,
      cwd: this.options.cwd,
    };
    this.logger.debug(`Watcher created with options: ${JSON.stringify(this.options)}`);
    if (!this.options.watchPath) {
      throw new Crash(`Watcher must have a watch path`, this.options.componentId);
    }
    const watchedPaths = Array.isArray(this.options.watchPath)
      ? this.options.watchPath
      : [this.options.watchPath];
    for (const folderPath of watchedPaths) {
      // Path must be a string
      if (typeof folderPath !== 'string') {
        throw new Crash(`Invalid watch path: ${folderPath}`, this.options.componentId);
      }
      const completePath = path.resolve(this.options.cwd || '', folderPath);
      // Path must exist
      if (!existsSync(completePath)) {
        throw new Crash(`Watch path does not exist: ${completePath}`, this.options.componentId);
      }
      // Path must be a directory
      const stats = statSync(completePath);
      if (!stats.isDirectory()) {
        throw new Crash(`Watch path is not a directory: ${completePath}`, this.options.componentId);
      }
    }
  }
  /**
   * Perform the subscription to the events from the watcher
   * @param watcher - The watcher instance
   */
  private wrappingEvents(watcher: FSWatcher): FSWatcher {
    watcher.on('error', this.onErrorEventHandler);
    watcher.on('ready', this.onReadyEventHandler);
    watcher.on('add', this.onAddEventHandler);
    watcher.on('change', this.onChangEventHandler);
    watcher.on('unlink', this.onUnlinkEventHandler);
    return watcher;
  }
  /**
   * Perform the unsubscription to the events from the watcher
   * @param watcher - The watcher instance
   */
  private unwrappingEvents(watcher: FSWatcher): FSWatcher {
    watcher.off('error', this.onErrorEventHandler);
    watcher.off('ready', this.onReadyEventHandler);
    watcher.off('add', this.onAddEventHandler);
    watcher.off('change', this.onChangEventHandler);
    watcher.off('unlink', this.onUnlinkEventHandler);
    return watcher;
  }
  /**
   * Event handler for the error event
   * @param rawError - The error that occurred
   */
  private readonly onErrorEventHandler = (rawError: Error) => {
    const cause = Crash.from(rawError);
    const error = new Crash(`Watcher error: ${cause.message}`, { cause });
    this.errorStacks.push(`${error.date.toISOString()} - ${error.message}`);
    if (this.errorStacks.length > this.options.maxErrors) {
      this.errorStacks.shift();
    }
    this.emit('error', error);
  };
  /** Event handler for the ready event */
  private readonly onReadyEventHandler = () => {
    this.ready = true;
    this.logger.debug('Watcher ready');
  };
  /**
   * Event handler for the add event
   * @param path - The path of the file added
   */
  private readonly onAddEventHandler = (path: string) => {
    this.logger.debug(`File added: ${path}`);
    this.emit('add', path);
  };
  /**
   * Event handler for the change event
   * @param path - The path of the file changed
   */
  private readonly onChangEventHandler = (path: string) => {
    this.logger.debug(`File changed: ${path}`);
  };
  /**
   * Event handler for the unlink event
   * @param path - The path of the file unlinked
   */
  private readonly onUnlinkEventHandler = (path: string) => {
    this.logger.debug(`File unlinked: ${path}`);
  };
  /** Get the status of the watcher */
  public get status(): Health.Status {
    return this.ready && !this.errorStacks.length ? 'pass' : 'fail';
  }
  /** Get the name of the watcher */
  public get name(): string {
    return this.options.name;
  }
  /** Get the component identifier */
  public get componentId(): string {
    return this.options.componentId;
  }
  /** Get the error stack */
  public get errors(): string[] {
    return this.errorStacks;
  }
  /** Get the health checks */
  public get checks(): Health.Checks {
    const errorsLength = this.errorStacks.length;
    const lastError = errorsLength ? this.errorStacks[errorsLength - 1] : undefined;
    const lastErrorDate = lastError ? lastError.split(' - ')[0] : undefined;
    return {
      [`${this.options.name}:errors`]: [
        {
          status: errorsLength ? Health.STATUS.FAIL : Health.STATUS.PASS,
          componentId: this.options.componentId,
          componentType: 'watcher',
          observedValue: this.errorStacks,
          observedUnit: 'observed errors',
          time: lastErrorDate,
          output: errorsLength ? `Some error occurred in the watcher` : undefined,
        },
      ],
      [`${this.options.name}:status`]: [
        {
          status: this.status,
          componentId: this.options.componentId,
          componentType: 'watcher',
          observedValue: this.status,
          observedUnit: 'status',
          time: new Date().toISOString(),
          output: this.status === 'fail' ? 'Watcher is not ready' : undefined,
        },
      ],
      [`${this.options.name}:watcher`]: [
        {
          status: this.watcher ? Health.STATUS.PASS : Health.STATUS.WARN,
          componentId: this.options.componentId,
          componentType: 'watcher',
          observedValue: this.watcher ? this.watcher.getWatched() : undefined,
          observedUnit: 'watched files',
          time: new Date().toISOString(),
          output: this.watcher ? undefined : 'Watcher is not started',
        },
      ],
    };
  }
  /** Start the watcher */
  public async start(): Promise<void> {
    if (this.watcher) {
      this.logger.debug('Watcher already started');
      const watched = this.watcher.getWatched();
      if (!watched || !Object.keys(watched).length) {
        this.logger.debug('No files watched');
        this.watcher.add(this.options.watchPath);
      }
      return;
    }
    this.watcher = this.wrappingEvents(watch([], this.fsWatcherOptions));
    this.watcher.add(this.options.watchPath);
  }
  /** Stop the watcher */
  public async stop(): Promise<void> {
    if (!this.watcher) {
      this.logger.debug('Watcher already stopped');
      return;
    }
    this.watcher.unwatch(this.options.watchPath);
    this.ready = false;
  }
  /** Close the watcher */
  public async close(): Promise<void> {
    if (!this.watcher) {
      this.logger.debug('Watcher already stopped');
      return;
    }
    this.unwrappingEvents(this.watcher);
    try {
      await this.watcher.close();
      this.watcher = undefined;
      this.ready = false;
    } catch (rawError) {
      const cause = Crash.from(rawError);
      throw new Crash(`Error closing the watcher: ${cause.message}`, { cause });
    }
  }
}
