/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash } from '@mdf.js/crash';
import { DebugLogger, LoggerInstance, SetContext } from '@mdf.js/logger';
import fs from 'fs';
import { get, merge } from 'lodash';
import path from 'path';
import { EventEmitter } from 'stream';
import { v4 } from 'uuid';
import { FileHandler } from './FileHandler';
import {
  AppendResult,
  ArchiveOptions,
  DEFAULT_ARCHIVE_OPTIONS,
  DEFAULT_BASE_FILENAME,
  FileStats,
} from './types';

/** Class responsible of managing jsonl file store operations */
export declare interface ArchiverManager {
  /**
   * Add a listener for the `error` event, emitted when there is an error in a file handler
   * operation.
   * @param event - `error` event
   * @param listener - Error event listener
   * @event
   */
  on(event: 'error', listener: (error: Crash) => void): this;
  /**
   * Add a listener for the `rotate` event, emitted when a file is rotated.
   * @param event - `error` event
   * @param listener - Error event listener
   * @event
   */
  on(event: 'rotate', listener: (stats: FileStats) => void): this;
  /**
   * Add a listener for the `resolve` event, emitted when an operation is resolved.
   * @param event - `resolve` event
   * @param listener - Resolve event listener
   * @event
   */
  on(event: 'resolve', listener: (stats: FileStats) => void): this;
  /**
   * Adds a listener for the `handlerCleaned` event, emitted when a handler is cleaned up due to inactivity.
   * @param event - `handlerCleaned` event
   * @param listener - Handler cleaned event listener
   */
  on(event: 'handlerCleaned', listener: (handlerName: string) => void): this;
}

/** Class responsible of managing jsonl file store operations */
export class ArchiverManager extends EventEmitter {
  /** Unique identifier */
  private readonly uuid: string = v4();
  /** Logger instance for deep debugging tasks */
  private readonly logger: LoggerInstance;
  /** Map of open files managers */
  private fileHandlersMap: Map<string, FileHandler> = new Map();
  /** Timer for cleaning up inactive handlers */
  private cleanupTimer: NodeJS.Timeout | undefined;
  /** Flag to check if the manager has been started */
  private hasBeenStarted = false;
  /** Options for the jsonl file store manager */
  private readonly options: ArchiveOptions;
  /**
   * Creates a new instance of the ArchiverManager.
   * @param options - Service setup options
   */
  constructor(options?: Partial<ArchiveOptions>) {
    super();
    this.options = merge({}, DEFAULT_ARCHIVE_OPTIONS, options);
    this.logger = SetContext(
      this.options.logger || new DebugLogger(`mdf:archiver:${this.uuid}`),
      `archiver:${this.uuid}`,
      this.uuid
    );
    this.checkRotationOptions();
    this.setupFolders();
  }
  /** Returns the statistics of the files */
  public get stats(): Record<string, FileStats> {
    const stats: Record<string, FileStats> = {};
    for (const [filename, manager] of this.fileHandlersMap) {
      stats[filename] = manager.stats;
    }
    return stats;
  }
  /** Returns the error status of the file handlers */
  public hasErrors(): boolean {
    for (const manager of this.fileHandlersMap.values()) {
      if (manager.stats.onError) {
        return true;
      }
    }
    return false;
  }
  /** Starts the ArchiverManager */
  public async start(): Promise<void> {
    this.logger.debug(`Starting ArchiverManager`);
    this.startCleanupTimer();
  }
  /** Stops the jsonl file store manager */
  public async stop(): Promise<void> {
    this.logger.debug(`Stopping ArchiverManager`);
    if (this.cleanupTimer) {
      clearTimeout(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    for (const manager of this.fileHandlersMap.values()) {
      await manager.close();
      manager.removeAllListeners();
    }
    this.fileHandlersMap.clear();
    this.hasBeenStarted = false;
  }
  /**
   * Appends data to a JSONL file.
   * @param data - Data to append
   */
  public async append(data: Record<string, any> | Record<string, any>[]): Promise<AppendResult>;
  /**
   * Appends data to a JSONL file.
   * @param data - Data to append
   * @param filename - Name of the file to append data to
   */
  public async append(
    data: Record<string, any> | Record<string, any>[],
    filename?: string
  ): Promise<AppendResult>;
  public async append(
    data: Record<string, any> | Record<string, any>[],
    filename?: string
  ): Promise<AppendResult> {
    if (!this.hasBeenStarted) {
      this.logger.debug(`Starting ArchiverManager, as it was not started`);
      await this.start();
    }
    const _data = Array.isArray(data) ? data : [data];
    const result: AppendResult = {
      appended: 0,
      errors: 0,
      skipped: 0,
      errorRecords: [],
      skippedRecords: [],
      success: false,
    };
    for (const item of _data) {
      try {
        if (this.shouldBeSkipped(item)) {
          result.skipped++;
          result.skippedRecords.push(item);
          continue;
        }
        await this.appendData(item, filename);
        result.appended++;
      } catch (error) {
        result.errors++;
        result.errorRecords.push({ record: item, error: Crash.from(error) as Crash });
      }
    }
    result.success = result.errors === 0;
    return result;
  }
  /**
   * Appends data to a JSONL file.
   * @param data - Data to append
   * @param filename - Name of the file to append data to
   */
  private async appendData(data: Record<string, any>, filename?: string): Promise<void> {
    const baseFilename = this.getBaseName(data, filename);
    try {
      const manager = this.getActiveFileHandler(baseFilename);
      const dataString = this.getData(data);
      await manager.append(dataString);
    } catch (rawError) {
      const cause = Crash.from(rawError);
      throw new Crash(`Error appending data to file [${baseFilename}]`, {
        cause,
        info: { baseFilename },
      });
    }
  }
  /**
   * Gets the base name of the file to store the data.
   * @param data - Data to store
   * @param filename - Name of the file to store the data
   * @returns Base name of the file
   */
  private getBaseName(data: Record<string, any>, filename?: string): string {
    if (typeof filename === 'string') {
      return filename;
    }
    if (typeof this.options.propertyFileName === 'string') {
      return get(
        data,
        this.options.propertyFileName,
        this.options.defaultBaseFilename || DEFAULT_BASE_FILENAME
      );
    }
    return this.options.defaultBaseFilename || DEFAULT_BASE_FILENAME;
  }
  /**
   * Gets the active file handler for a given file name or creates a new one if it does not exist.
   * @param name - Active file handler name
   * @returns Active file handler
   */
  private getActiveFileHandler(name: string): FileHandler {
    let manager = this.fileHandlersMap.get(name);
    if (!manager) {
      manager = new FileHandler(name, { ...this.options, baseFilename: name }, this.logger);
      manager.on('error', this.errorEventHandler.bind(this));
      manager.on('rotate', this.rotateEventHandler.bind(this));
      manager.on('resolve', this.resolveEventHandler.bind(this));
      this.fileHandlersMap.set(name, manager);
    }
    return manager;
  }
  /**
   * Get the data to store in the file as a string.
   * @param data - Data to store
   * @returns Data as a string
   */
  private getData(data: Record<string, any>): string {
    let _data = data;
    if (typeof this.options.propertyData === 'string') {
      _data = get(data, this.options.propertyData, data);
    }
    return `${JSON.stringify(_data)}${this.options.separator || '\n'}`;
  }
  /**
   * Checks if the data should be skipped based on the options.
   * @param data - Data to check
   * @returns True if the data should be skipped
   */
  private shouldBeSkipped(data: Record<string, any>): boolean {
    if (typeof this.options.propertySkip === 'string') {
      const skip = get(data, this.options.propertySkip, false);
      if (
        typeof this.options.propertySkipValue !== 'undefined' &&
        this.options.propertySkipValue !== null
      ) {
        return skip === this.options.propertySkipValue;
      } else {
        return skip !== false && skip !== 0 && skip !== '';
      }
    }
    return false;
  }
  /**
   * Setups the folders for the jsonl file store, moving the files from the working folder to the
   * archive folder. If the folders do not exist, it will create them.
   */
  private setupFolders(): void {
    const workingFolderPath = this.setupFolder(this.options.workingFolderPath);
    const archiveFolderPath = this.setupFolder(this.options.archiveFolderPath);
    try {
      const workingFiles = fs.readdirSync(workingFolderPath);
      for (const file of workingFiles) {
        const oldPath = path.join(workingFolderPath, file);
        const newPath = path.join(archiveFolderPath, file);
        fs.renameSync(oldPath, newPath);
      }
    } catch (error) {
      const cause = Crash.from(error);
      throw new Crash(`Error setting up files folder`, { cause });
    }
  }
  /**
   * Checks if a folder exists and creates it if it does not exist.
   * @param _folderPath - Path of the folder to check
   */
  private setupFolder(folderPath: string): string {
    const resolvedPath = path.resolve(folderPath);
    if (fs.existsSync(resolvedPath)) {
      return resolvedPath;
    }
    if (this.options.createFolders) {
      try {
        fs.mkdirSync(resolvedPath, { recursive: true });
        return resolvedPath;
      } catch (error) {
        const cause = Crash.from(error);
        throw new Crash(`Error creating folder [${resolvedPath}]`, { cause });
      }
    } else {
      throw new Crash(`Folder [${resolvedPath}] does not exist`);
    }
  }
  /** Checks if the rotation options are valid */
  private checkRotationOptions(): void {
    if (typeof this.options.rotationSize === 'number' && this.options.rotationSize <= 0) {
      throw new Crash(`Invalid rotation size: It must be greater than 0`);
    } else if (typeof this.options.rotationLines === 'number' && this.options.rotationLines <= 0) {
      throw new Crash(`Invalid rotation lines: It must be greater than 0`);
    } else if (
      typeof this.options.rotationInterval === 'number' &&
      this.options.rotationInterval <= 0
    ) {
      throw new Crash(`Invalid rotation interval: It must be greater than 0`);
    } else if (
      typeof this.options.rotationSize !== 'number' &&
      typeof this.options.rotationLines !== 'number' &&
      typeof this.options.rotationInterval !== 'number'
    ) {
      throw new Crash(`Invalid rotation options: At least one rotation option must be set`);
    }
  }
  /** Starts the cleanup timer to remove inactive handlers */
  private startCleanupTimer(): void {
    if (typeof this.options.inactiveTimeout === 'number' && this.options.inactiveTimeout > 0) {
      this.cleanupTimer = setInterval(this.cleanupInactiveHandlers, this.options.inactiveTimeout);
      this.logger.debug(`Cleanup timer started with interval ${this.options.inactiveTimeout}`);
      this.cleanupTimer.unref(); // Allow the process to exit even if the timer is active
    }
    this.hasBeenStarted = true;
  }
  /** Cleans up inactive handlers */
  private cleanupInactiveHandlers = (): void => {
    const now = Date.now();
    for (const [handlerName, handler] of this.fileHandlersMap.entries()) {
      const lastModified = new Date(handler.stats.lastModifiedTimestamp).getTime();
      const inactiveTime = now - lastModified;
      if (inactiveTime >= (this.options.inactiveTimeout || 0)) {
        this.logger.debug(`Cleaning up inactive handler [${handlerName}]`);
        handler.close().catch(rawError => {
          const cause = Crash.from(rawError);
          this.errorEventHandler(
            new Crash(`Error cleaning up handler ${handlerName} due to inactivity`, { cause })
          );
        });
        handler.removeAllListeners();
        this.fileHandlersMap.delete(handlerName);
        this.emit('handlerCleaned', handlerName);
      }
    }
  };
  /** Emit error only if there is at least 1 listener for this event */
  private errorEventHandler(error: Crash): void {
    this.logger.crash(error);
    if (this.listenerCount('error') > 0) {
      this.emit('error', error);
    }
  }
  /** Emit success if there is at least 1 listener for this event */
  private rotateEventHandler(stats: FileStats): void {
    if (this.listenerCount('rotate') > 0) {
      this.emit('rotate', stats);
    }
  }
  /** Emit success if there is at least 1 listener for this event */
  private resolveEventHandler(stats: FileStats): void {
    if (this.listenerCount('resolve') > 0) {
      this.emit('resolve', stats);
    }
  }
}
