/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash } from '@mdf.js/crash';
import { DebugLogger, LoggerInstance, SetContext } from '@mdf.js/logger';
import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'stream';
import { v4 } from 'uuid';
import { SingleJsonlFileManager } from './SingleJsonlFileManager';
import {
  JsonlFileStatistics,
  JsonlFileStoreManagerOptions,
  SingleJsonlFileManagerOptions,
} from './types';

export declare interface JsonlFileStoreManager {
  /**
   * Add a listener for the `error` event, emitted when there is an error in a jsonl file store operation.
   * @param event - `error` event
   * @param listener - Error event listener
   * @event
   */
  on(event: 'error', listener: (error: Crash) => void): this;
  /**
   * Add a listener for the `success` event, emitted when a jsonl file store operation
   * is successfull after one with error.
   * @param event - `error` event
   * @param listener - Error event listener
   * @event
   */
  on(event: 'success', listener: () => void): this;
}

/** Class responsible of managing jsonl file store operations */
export class JsonlFileStoreManager extends EventEmitter {
  /** Unique identifier */
  private readonly uuid: string = v4();
  /** Logger instance for deep debugging tasks */
  private readonly logger: LoggerInstance;
  /** Operation error, if exist */
  private _error?: Crash;
  /** Map of open files managers */
  private openFilesManagers: Map<string, SingleJsonlFileManager>;
  /** Statistics of files */
  private filesStatistics: Record<string, JsonlFileStatistics> = {};

  /**
   * Creates a new instance of the file manager
   * @param name - Service name
   * @param options - Service setup options
   * @param logger - Logger instance (optional)
   */
  constructor(
    private readonly name: string,
    readonly options: JsonlFileStoreManagerOptions,
    logger?: LoggerInstance
  ) {
    super();
    this.logger = SetContext(
      logger || new DebugLogger(`mdf:client:${this.name}`),
      this.name,
      this.uuid
    );
    this.openFilesManagers = new Map();
  }
  /** Flag to indicate that there have been some errors */
  public get isErrored(): boolean {
    return this.error !== undefined;
  }
  /** Jsonl file store error, if exists */
  public get error(): Crash | undefined {
    return this._error;
  }

  /** Get the statistics of the files */
  public get filesStats(): Record<string, JsonlFileStatistics> {
    return this.filesStatistics;
  }

  /** Emit error only if there is at least 1 listener for this event */
  private emitError(error: Crash): void {
    this.logger.error(error.message);

    if (this.listenerCount('error') > 0) {
      const cause = Crash.from(error);
      this._error = new Crash(`Error in jsonl file store operation`, { cause });
      this.emit('error', this._error);
    }
  }

  /** Emit success if there is at least 1 listener for this event */
  private emitSuccess(): void {
    if (this.listenerCount('success') > 0) {
      this._error = undefined;
      this.emit('success');
    }
  }

  /** Starts the jsonl file store manager */
  public start(): void {
    try {
      this.checkValidRotationInterval();
      this.setupFolders();
    } catch (error) {
      const cause = Crash.from(error);
      const crash = new Crash(`Error creating JsonlFileStoreManager instance`, { cause });
      if (this.options.failOnStartSetup) {
        throw crash;
      } else {
        this.emitError(crash);
      }
    }
  }

  /** Stops the jsonl file store manager */
  public stop(): void {
    for (const manager of this.openFilesManagers.values()) {
      clearInterval(manager.rotationTimer);
      manager.rotationTimer = undefined;
    }
    this.openFilesManagers.clear();
  }

  /**
   * Appends data to a jsonl file.
   * @param data - Data to append
   * @param filename - Base name of the file to append data to. This is not the real file name,
   * but the base name used by the SingleJsonlFileManager to create unique names in order to
   * internally perform the rotation process in a proper manner.
   */
  public async append(data: string, filename: string): Promise<void> {
    try {
      let manager = this.openFilesManagers.get(filename);
      if (!manager) {
        const managerOptions: SingleJsonlFileManagerOptions = {
          ...this.options,
          baseFilename: filename,
        };
        manager = new SingleJsonlFileManager(`${filename}-manager`, managerOptions, this.logger);
        manager.on('error', this.emitError.bind(this));
        this.openFilesManagers.set(filename, manager);
      }

      await manager.append(data);
      this.updateFilesStatistics(filename, true);
      this.emitSuccess();
    } catch (error) {
      const cause = Crash.from(error);
      const crash = new Crash(`Error appending data to file`, { cause });
      this.updateFilesStatistics(filename, false);
      this.emitError(crash);
    }
  }

  /**
   * Updates the statistics of the files
   * @param filename - Name of the file
   * @param success - Flag to indicate if the operation was successful
   */
  private updateFilesStatistics(filename: string, success: boolean): void {
    if (!this.filesStatistics[filename]) {
      this.filesStatistics[filename] = {
        numberOfAppendSuccesses: 0,
        numberOfAppendErrors: 0,
        lastAppendSuccessTimestamp: '',
        lastAppendErrorTimestamp: '',
      };
    }
    if (success) {
      this.filesStatistics[filename].numberOfAppendSuccesses++;
      this.filesStatistics[filename].lastAppendSuccessTimestamp = new Date().toISOString();
    } else {
      this.filesStatistics[filename].numberOfAppendErrors++;
      this.filesStatistics[filename].lastAppendErrorTimestamp = new Date().toISOString();
    }
  }

  /**
   * Sets up the open and closed files folder by moving creating them if they do not exist
   * and moving all existing files from the open files folder to the closed files folder
   */
  private setupFolders(): void {
    const openFolderPath = path.resolve(this.options.openFilesFolderPath);
    const closedFolderPath = path.resolve(this.options.closedFilesFolderPath);

    this.checkFoldersExist(openFolderPath);
    this.checkFoldersExist(closedFolderPath);

    try {
      const openFiles = fs.readdirSync(openFolderPath);
      for (const file of openFiles) {
        const oldPath = path.join(openFolderPath, file);
        const newPath = path.join(closedFolderPath, file);
        fs.renameSync(oldPath, newPath);
      }
    } catch (error) {
      const cause = Crash.from(error);
      const crash = new Crash(`Error setting up files folder`, { cause });
      throw crash;
    }
  }

  /**
   * Checks if a folder exists and creates it if it does not exist.
   * @param folderPath - Path of the folder to check
   */
  private checkFoldersExist(folderPath: string): void {
    if (!fs.existsSync(folderPath)) {
      if (this.options.createFolders) {
        fs.mkdirSync(folderPath, { recursive: true });
      } else {
        throw new Crash(`Error: Folder [${folderPath}] does not exist`);
      }
    }
  }

  /** Checks if the rotation interval is valid */
  private checkValidRotationInterval(): void {
    if (this.options.rotationInterval <= 0) {
      throw new Crash(`Invalid rotation interval: It must be greater than 0`);
    }
  }
}
