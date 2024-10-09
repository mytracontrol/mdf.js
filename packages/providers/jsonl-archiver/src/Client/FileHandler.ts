/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash } from '@mdf.js/crash';
import { LoggerInstance } from '@mdf.js/logger';
import { Limiter, MetaData } from '@mdf.js/tasks';
import { RetryOptions } from '@mdf.js/utils';
import EventEmitter from 'events';
import fs from 'fs';
import { cloneDeep } from 'lodash';
import path from 'path';
import { DEFAULT_STATS, FileHandlerOptions, FileStats } from './types';

export declare interface FileHandler {
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
}
/** File handler class for managing file operations */
export class FileHandler extends EventEmitter {
  /** The name of the current file being managed */
  private workingFile: string | undefined;
  /** Timer for time-based file rotation */
  private rotationTimer: NodeJS.Timeout | undefined;
  /** The file stream for the current file */
  private currentFileStream: fs.WriteStream | null = null;
  /** Limiter instance for managing concurrent operations */
  private limiter: Limiter;
  /** File stats */
  public readonly stats: FileStats = { ...DEFAULT_STATS };
  /** Flag to indicate if a rotation is scheduled */
  public rotationScheduled = false;
  /**
   * Creates a new instance of the file manager
   * @param name - Service name
   * @param options - Service setup options
   * @param logger - Logger instance
   */
  constructor(
    public readonly name: string,
    readonly options: FileHandlerOptions,
    private readonly logger: LoggerInstance
  ) {
    super();
    this.limiter = this.getDefaultLimiter(options.retryOptions);
    this.stats.handler = name;
  }
  /**
   * Gets the current file stream.
   * If a file stream is not open, a new file stream is created.
   * @returns The current file stream.
   */
  private getStream(): fs.WriteStream {
    if (this.currentFileStream && !this.currentFileStream.writableEnded) {
      return this.currentFileStream;
    }
    const date = new Date();
    this.workingFile = this.getFileName(date);
    const workingFilePath = path.join(this.options.workingFolderPath, this.workingFile);

    this.logger.debug(`Creating new file stream: ${workingFilePath}`);
    this.currentFileStream = fs.createWriteStream(workingFilePath, { flags: 'a' });

    this.stats.fileName = this.workingFile;
    this.stats.filePath = workingFilePath;
    this.stats.isActive = true;
    this.stats.creationTimestamp = date.toISOString();
    this.stats.lastModifiedTimestamp = date.toISOString();
    this.stats.currentSize = 0;
    this.stats.numberLines = 0;
    this.stats.appendSuccesses = 0;
    this.stats.appendErrors = 0;

    if (!this.rotationTimer && this.options.rotationInterval) {
      this.rotationTimer = setTimeout(this.onRotationTimeOut, this.options.rotationInterval);
    }
    return this.currentFileStream;
  }
  /**
   * Generates a file name based on the current date.
   * @param date - The date to use for the file name.
   * @returns The generated file name.
   */
  private getFileName(date: Date): string {
    const formattedYear = date.getFullYear();
    const formattedMonth = (date.getMonth() + 1).toString().padStart(2, '0');
    const formattedDay = date.getDate().toString().padStart(2, '0');
    const _date = `${formattedYear}-${formattedMonth}-${formattedDay}`;
    const formattedHours = date.getHours().toString().padStart(2, '0');
    const formattedMinutes = date.getMinutes().toString().padStart(2, '0');
    const formattedSeconds = date.getSeconds().toString().padStart(2, '0');
    const _time = `${formattedHours}-${formattedMinutes}-${formattedSeconds}`;

    return `${this.options.baseFilename}_${this.stats.rotationCount}_${_date}_${_time}.jsonl`;
  }
  /**
   * Gets the default limiter for the file handler.
   * @param retryOptions - The retry options for the limiter.
   * @returns The default limiter for the file handler.
   */
  private getDefaultLimiter(retryOptions?: RetryOptions): Limiter {
    const limiter = new Limiter({ concurrency: 1, autoStart: true, delay: 0, retryOptions });
    limiter.on('done', this.onTaskDone);
    return limiter;
  }
  /**
   * Determines if the file should be rotated based on size or number of lines.
   * @returns True if rotation is needed; otherwise, false.
   */
  private shouldRotate(): boolean {
    if (this.rotationScheduled) {
      return false;
    }
    if (this.options.rotationSize && this.stats.currentSize >= this.options.rotationSize) {
      this.logger.info(
        `File size limit reached: ${this.stats.currentSize} >= ${this.options.rotationSize}`
      );
      return true;
    }
    if (this.options.rotationLines && this.stats.numberLines >= this.options.rotationLines) {
      this.logger.info(
        `File line limit reached: ${this.stats.numberLines} >= ${this.options.rotationLines}`
      );
      return true;
    }
    return false;
  }
  /**
   * Task handler for appending data to the file.
   * @param data - The data to append to the file.
   */
  private _append = async (data: string) => {
    try {
      await this.appendData(data);
      if (this.shouldRotate()) {
        this.rotationScheduled = true;
        this.limiter.schedule(this._rotate, [], { bind: this, id: 'rotate' });
      }
    } catch (error) {
      throw new Crash(`Error appending data`, { cause: Crash.from(error) });
    }
  };
  /** Task handler for rotating the file. */
  private _rotate = async (): Promise<FileStats> => {
    let stats: FileStats;
    try {
      stats = await this.closeFile();
    } catch (error) {
      throw new Crash(`Error rotating file`, { cause: Crash.from(error) });
    } finally {
      this.rotationScheduled = false;
    }
    try {
      await this.moveFile(stats.fileName);
    } catch (error) {
      this.emit('error', new Crash(`Error moving file`, { cause: Crash.from(error) }));
    }
    return stats;
  };
  /**
   * Appends data to the current file stream.
   * @param data - The data to append to the file.
   * @returns A promise that resolves when the data has been appended.
   */
  private appendData = async (data: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      let stream: fs.WriteStream;
      try {
        stream = this.getStream();
      } catch (rawError) {
        const cause = Crash.from(rawError);
        const error = new Crash(`Error getting stream: ${cause.message}`, { cause });
        this.stats.appendErrors++;
        this.stats.lastError = error;
        this.stats.onError = true;
        reject(error);
        return;
      }
      stream.write(data, this.options.fileEncoding, rawError => {
        if (rawError) {
          const cause = Crash.from(rawError);
          const error = new Crash(`Error appending data: ${cause.message}`, { cause });
          this.stats.appendErrors++;
          this.stats.lastError = error;
          this.stats.onError = true;
          reject(error);
        } else {
          const dataSize = Buffer.byteLength(data, this.options.fileEncoding || 'utf8');
          this.stats.currentSize += dataSize;
          this.stats.numberLines++;
          this.stats.appendSuccesses++;
          this.stats.lastModifiedTimestamp = new Date().toISOString();
          if (this.stats.onError) {
            this.stats.onError = false;
            this.emit('resolve', this.stats);
          }
          resolve();
        }
      });
    });
  };
  /**
   * Rotates the current file by renaming it
   * @returns A promise that resolves when the file rotation is complete.
   */
  private closeFile = async (): Promise<FileStats> => {
    if (this.rotationTimer) {
      clearTimeout(this.rotationTimer);
      this.rotationTimer = undefined;
    }
    return new Promise(resolve => {
      if (!this.currentFileStream) {
        resolve(this.stats);
        return;
      }
      this.currentFileStream.end(() => {
        const _stats = cloneDeep(this.stats);
        this.currentFileStream = null;
        this.stats.filePath = '';
        this.stats.fileName = '';
        this.stats.isActive = false;
        this.stats.creationTimestamp = '';
        this.stats.lastModifiedTimestamp = '';
        this.stats.lastRotationTimestamp = new Date().toISOString();
        this.stats.currentSize = 0;
        this.stats.numberLines = 0;
        this.stats.appendSuccesses = 0;
        this.stats.appendErrors = 0;
        this.stats.rotationCount++;
        this.stats.lastError = undefined;
        this.stats.onError = false;
        this.workingFile = undefined;
        resolve(_stats);
      });
    });
  };
  /**
   * Moves the current file to the closed folder
   * @throws A Crash error if the file cannot be moved
   */
  private moveFile = (filename: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const activeFilePath = path.join(this.options.workingFolderPath, filename);
      const archivedFilePath = path.join(this.options.archiveFolderPath, filename);
      fs.rename(activeFilePath, archivedFilePath, rawError => {
        if (rawError) {
          const cause = Crash.from(rawError);
          const error = new Crash(`Error moving file: ${cause.message}`, { cause });
          reject(error);
        } else {
          resolve();
        }
      });
    });
  };
  /**
   * Event handler for the `done` event.
   * @param uuid - The unique identifier of the task
   * @param result - The result of the task
   * @param meta - The metadata of the task
   * @param error - The error of the task
   */
  private onTaskDone = (uuid: string, result: FileStats, meta: MetaData, error?: Crash) => {
    if (error) {
      this.logger.silly(`Task ${meta.taskId} failed: ${uuid}: ${error.message}`);
      this.emit(
        'error',
        new Crash(`Error on file handler ${this.name} during [${meta.taskId}] process`, {
          cause: error,
          info: meta,
        })
      );
    } else {
      this.logger.silly(`Task ${meta.taskId} completed: ${uuid}`);
      if (meta.taskId === 'rotate') {
        this.emit('rotate', result);
      }
    }
    this.logger.silly(`Task ${meta.taskId}: ${JSON.stringify(meta)}`);
  };
  /** Event handler for the rotation timeout */
  private onRotationTimeOut = async () => {
    if (this.rotationScheduled) {
      return;
    }
    this.logger.debug(`Rotation timeout reached`);
    this.rotationScheduled = true;
    this.limiter.schedule(this._rotate, [], { bind: this, id: 'rotate' });
  };
  /**
   * Appends data to the file store.
   * This method uses the Limiter to ensure only one file operation is executed
   * at a time (concurrency=1) and to retry the append operation if necessary
   * @param data - The data to append to the file.
   * @returns A promise that resolves when the append operation is complete.
   */
  public async append(data: string): Promise<void> {
    try {
      await this.limiter.execute(this._append, [data], { bind: this, id: `append` });
    } catch (rawError) {
      const cause = Crash.from(rawError);
      throw new Crash(`Error appending data on file handler ${this.name}`, { cause });
    }
  }
  /**
   * Closes the current file stream.
   * @returns A promise that resolves when the file stream is closed.
   */
  public async close(): Promise<void> {
    this.logger.info(`Closing file stream: ${this.workingFile}`);
    await this.limiter.execute(this._rotate, [], { bind: this, id: 'rotate' });
    this.limiter.stop();
    this.limiter.clear();
  }
}
