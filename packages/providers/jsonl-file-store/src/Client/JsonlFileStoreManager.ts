/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash, Multi } from '@mdf.js/crash';
import { DebugLogger, LoggerInstance, SetContext } from '@mdf.js/logger';
import { Single } from '@mdf.js/tasks';
import fs from 'fs';
import _ from 'lodash';
import path from 'path';
import { EventEmitter } from 'stream';
import { v4 } from 'uuid';
import { JsonlFileStoreManagerOptions, WriteOptions } from './types';

export declare interface JsonlFileStoreManager {
  /**
   * Add a listener for the `error` event, emitted when there is an error in a jsonl file store operation.
   * @param event - `error` event
   * @param listener - Error event listener
   * @event
   */
  on(event: 'errored', listener: () => void): this;
  /**
   * Add a listener for the `no-error` event, emitted when a jsonl file store operation is successfull after an erroed one.
   * @param event - `error` event
   * @param listener - Error event listener
   * @event
   */
  on(event: 'no-errored', listener: () => void): this;
  /**
   * Add a listener for the `append-complete` event, emitted when the append operation is complete.
   * @param event - `append-complete` event
   * @param listener - Append complete event listener
   * @event
   */
  on(event: 'append-complete', listener: () => void): this;
  /**
   * Add a listener for the `rotation-complete` event, emitted when the rotation operation is complete.
   * @param event - `rotation-complete` event
   * @param listener - Rotation complete event listener
   * @event
   */
  on(event: 'rotation-complete', listener: () => void): this;
}

/** Class responsible of managing jsonl file store operations */
export class JsonlFileStoreManager extends EventEmitter {
  /** Unique identifier */
  private readonly uuid: string = v4();
  /** Logger instance for deep debugging tasks */
  private readonly logger: LoggerInstance;
  /** The name of the current file being managed by the JsonlFileStoreManager */
  private currentFileName: string;
  /** The path of the current file being managed by the JsonlFileStoreManager */
  private currentFilePath: string;
  /** The interval at which the file manager will rotate files */
  private rotationInterval: number;
  /** The timer that triggers the rotation of files */
  private rotationTimer: NodeJS.Timeout | undefined;
  /** Flag to indicate if the file manager is currently appending data to a file */
  private isAppending: boolean;
  /** Flag to indicate if the file manager is currently rotating files */
  private isRotating: boolean;
  /** Operation error, if exist */
  private _error?: Multi;
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
    try {
      this.logger = SetContext(
        logger || new DebugLogger(`mdf:client:${this.name}`),
        this.name,
        this.uuid
      );
      this.currentFileName = this.generateNewOpenFileName();
      this.currentFilePath = path.join(
        this.options.rotationOptions.openFilesFolderPath,
        this.currentFileName
      );
      this.rotationInterval = options.rotationOptions.interval;
      this.isAppending = false;
      this.isRotating = false;
      this.setupOpenFilesFolder();
      this.rotationTimer = setInterval(() => {
        this.rotate();
      }, this.rotationInterval);
    } catch (error) {
      const cause = Crash.from(error);
      throw new Crash(`Error creating JsonlFileStoreManager instance`, { cause });
    }
  }
  /** Flag to indicate that there have been some errors */
  public get isErrored(): boolean {
    return this.error !== undefined;
  }
  /** Jsonl file store error, if exists */
  public get error(): Multi | undefined {
    return this._error;
  }

  /** Add a new error or create a new one */
  private addError(error: Crash): void {
    this.logger.error(error.message);
    if (this._error) {
      this._error.push(error);
    } else {
      this._error = new Multi(`Error in jsonl file store operation`, { causes: error });
    }
    this.emit('errored', this._error);
  }

  /** Reset error when last operation was successfull*/
  private resetError(): void {
    if (this._error) {
      this._error = undefined;
      this.emit('no-errored');
    }
  }

  /**
   * Generates a new file name based on the current timestamp.
   * @returns {string} The generated file name in the format `data_<timestamp>`.
   */
  private generateNewOpenFileName(): string {
    const timestamp = this.getFormattedTimestamp(new Date());
    return `data_${timestamp}`;
  }

  /**
   * Formats a given Date object into a timestamp stringin format `YYYY-MM-DD_HHMMSS`.
   * @param date - The Date object to format.
   * @returns A string representing the formatted timestamp.
   */
  private getFormattedTimestamp(date: Date): string {
    const formattedYear = date.getFullYear();
    const formattedMonth = (date.getMonth() + 1).toString().padStart(2, '0');
    const formattedDay = date.getDate().toString().padStart(2, '0');
    const formattedHours = date.getHours().toString().padStart(2, '0');
    const formattedMinutes = date.getMinutes().toString().padStart(2, '0');
    const formattedSeconds = date.getSeconds().toString().padStart(2, '0');

    return `${formattedYear}-${formattedMonth}-${formattedDay}_${formattedHours}${formattedMinutes}${formattedSeconds}`;
  }

  /**
   * Sets up the open files folder by moving all files from the open files folder
   * to the closed files folder and then creating a new empty file.
   */
  private setupOpenFilesFolder(): void {
    const openFolderPath = this.options.rotationOptions.openFilesFolderPath;
    const closedFolderPath = this.options.rotationOptions.closedFilesFolderPath;

    try {
      fs.readdirSync(openFolderPath).forEach(file => {
        const oldPath = path.join(openFolderPath, file);
        const newPath = path.join(closedFolderPath, file);
        fs.renameSync(oldPath, newPath);
      });

      fs.writeFileSync(this.currentFilePath, '', this.options.writeOptions);
    } catch (error) {
      const cause = Crash.from(error);
      const crash = new Crash(`Error setting up open files folder`, { cause });
      this.addError(crash);
      throw crash;
    }
  }

  /**
   * Rotates the JSONL file store.
   * This method returns a promise that resolves when the rotation is complete.
   * It listens for the 'append-complete' event before starting the rotation.
   * If the 'append-complete' event has already occurred, it starts the rotation immediately.
   * @returns {Promise<void>} A promise that resolves when the rotation is complete.
   */
  private async rotate(): Promise<void> {
    return new Promise((resolve, reject) => {
      const onAppendComplete = async () => {
        try {
          this.off('append-complete', onAppendComplete);
          this.isRotating = true;
          const rotateTask = new Single(this.rotateFile.bind(this), {
            retryOptions: this.options.rotationOptions.retryOptions,
          });
          await rotateTask.execute();
          this.resetError();
          this.isRotating = false;
          this.emit('rotation-complete');
          resolve();
        } catch (error) {
          this.addError(error as Crash);
          this.isRotating = false;
          this.emit('rotation-complete');
          resolve();
        }
      };
      const waitForAppendComplete = () => {
        this.once('append-complete', onAppendComplete);
      };

      if (this.isAppending) {
        waitForAppendComplete();
      } else {
        onAppendComplete();
      }
    });
  }

  /**
   * Rotates the current log file by renaming it and creating a new empty file.
   * @returns {Promise<void>} A promise that resolves when the file rotation is complete.
   */
  private async rotateFile(): Promise<void> {
    try {
      const closedFilePath = path.join(
        this.options.rotationOptions.closedFilesFolderPath,
        this.currentFileName
      );
      fs.renameSync(this.currentFilePath, closedFilePath);
      this.currentFileName = this.generateNewOpenFileName();
      this.currentFilePath = path.join(
        this.options.rotationOptions.openFilesFolderPath,
        this.currentFileName
      );
      fs.writeFileSync(this.currentFilePath, '', this.options.writeOptions); // Create a new empty file
      return Promise.resolve();
    } catch (error) {
      const cause = Crash.from(error);
      const crash = new Crash(`Error rotating file`, { cause });
      return Promise.reject(crash);
    }
  }

  /** Appends data to a file.
   * @param path - The path of the file to append data to.
   * @param data - The data to append to the file. It can be a string or a Buffer.
   * @param options - The options for writing the file (optional). If not provided, the default
   * write options are used. Otherwise, the provided options are merged with the default ones.
   */
  private async appendFile(data: string, options?: WriteOptions): Promise<void> {
    if (typeof options === 'string') {
      options = { encoding: options };
    }
    const mergedOptions: WriteOptions = _.merge(_.cloneDeep(this.options.writeOptions), options);
    try {
      fs.appendFileSync(this.currentFilePath, data, mergedOptions);
      return Promise.resolve();
    } catch (error) {
      const cause = Crash.from(error);
      const crash = new Crash(`Error appending data to file`, { cause });
      return Promise.reject(crash);
    }
  }

  /**
   * Appends data to the file store.
   * This method handles file rotation and retries the append operation if necessary.
   * It emits 'append-complete' event upon completion, regardless of success or failure.
   * If the file is currently rotating, it waits for the rotation to complete before appending.
   *
   * @param data - The string data to append to the file.
   * @param options - Optional write options.
   * @returns A promise that resolves when the append operation is complete.
   */
  public async append(data: string, options?: WriteOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      const onRotationComplete = async () => {
        try {
          this.off('rotation-complete', onRotationComplete);
          this.isAppending = true;
          const appendTask = new Single(this.appendFile.bind(this, data, options), {
            retryOptions: this.options.writeOptions.retryOptions,
          });
          await appendTask.execute();
          this.resetError();
          this.isAppending = false;
          this.emit('append-complete');
          resolve();
        } catch (error) {
          this.addError(error as Crash);
          this.isAppending = false;
          this.emit('append-complete');
          reject(error);
        }
      };
      const waitForRotationComplete = () => {
        this.once('rotation-complete', onRotationComplete);
      };

      if (this.isRotating) {
        waitForRotationComplete();
      } else {
        onRotationComplete();
      }
    });
  }

  /** Stops the rotation timer by clearing the interval and setting the timer to undefined */
  public stopRotationTimer(): void {
    clearInterval(this.rotationTimer);
    this.rotationTimer = undefined;
  }
}
