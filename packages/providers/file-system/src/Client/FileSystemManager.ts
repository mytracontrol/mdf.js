/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash, Multi } from '@mdf.js/crash';
import { DebugLogger, LoggerInstance, SetContext } from '@mdf.js/logger';
import fs from 'fs';
import _ from 'lodash';
import { EventEmitter } from 'stream';
import { v4 } from 'uuid';
import {
  CopyOptions,
  FileSystemManagerOptions,
  ReadDirOptions,
  ReadOptions,
  WriteOptions,
} from './types';

export declare interface FileSystemManager {
  /**
   * Add a listener for the `error` event, emitted when there is an error in a file system operation.
   * @param event - `error` event
   * @param listener - Error event listener
   * @event
   */
  on(event: 'error', listener: () => void): this;
  /**
   * Add a listener for the `no-error` event, emitted when a file system operation is successfull after an erroed one.
   * @param event - `error` event
   * @param listener - Error event listener
   * @event
   */
  on(event: 'no-error', listener: () => void): this;
}

/** Class responsible of managing file system operations */
export class FileSystemManager extends EventEmitter {
  /** Unique identifier */
  private readonly uuid: string = v4();
  /** Logger instance for deep debugging tasks */
  private readonly logger: LoggerInstance;
  /** Validation error, if exist */
  private _error?: Multi;
  /**
   * Creates a new instance of the file manager
   * @param name - Service name
   * @param options - Service setup options
   */
  constructor(
    private readonly name: string,
    private readonly options: FileSystemManagerOptions,
    logger?: LoggerInstance
  ) {
    super();
    this.logger = SetContext(
      logger || new DebugLogger(`mdf:client:${this.name}`),
      this.name,
      this.uuid
    );
  }
  /** Flag to indicate that there have been some errors */
  public get isErrored(): boolean {
    return this.error !== undefined;
  }
  /** File system error, if exists */
  public get error(): Multi | undefined {
    return this._error;
  }

  /** Add a new error or create a new one */
  private addError(error: Crash): void {
    this.logger.error(error.message);
    if (this._error) {
      this._error.push(error);
    } else {
      this._error = new Multi(`Error in file system operation`, { causes: error });
    }
    this.emit('error');
  }

  /** Reset error when last operation was successfull*/
  private resetError(): void {
    if (this._error) {
      this._error = undefined;
      this.emit('no-error');
    }
  }

  /** Appends data to a file.
   *
   * @param path - The path of the file to append data to.
   * @param data - The data to append to the file. It can be a string or a Buffer.
   * @param options - The options for writing the file (optional). If not provided, the default
   * write options are used. Otherwise, the provided options are merged with the default ones.
   */
  public appendFile(path: string, data: string | Buffer, options?: WriteOptions): void {
    if (typeof options === 'string') {
      options = { encoding: options };
    }
    const mergedOptions: WriteOptions = _.merge(_.cloneDeep(this.options.writeOptions), options);
    try {
      fs.appendFileSync(path, data, mergedOptions);
      this.resetError();
    } catch (error) {
      const cause = Crash.from(error);
      const crash = new Crash(`Error appending data to file`, { cause });
      this.addError(crash);
      throw crash;
    }
  }

  /**
   * Deletes a file at the specified path.
   *
   * @param path - The path of the file to be deleted.
   */
  public deleteFile(path: string): void {
    try {
      fs.unlinkSync(path);
      this.resetError();
    } catch (error) {
      const cause = Crash.from(error);
      const crash = new Crash(`Error deleting file`, { cause });
      this.addError(crash);
      throw crash;
    }
  }

  /**
   * Copies from the source file path to the destination file path.
   *
   * @param source - The path of the file to be copied.
   * @param destination - The path of the file to be copied to.
   * @param options - The options for copying the file (optional). If not provided, the default
   * copy options are used. Otherwise, the provided options are merged with the default ones.
   */
  public copyFile(source: string, destination: string, options?: CopyOptions): void {
    try {
      const mergedOptions: CopyOptions = _.merge(_.cloneDeep(this.options.copyOptions), options);
      fs.copyFileSync(source, destination, mergedOptions.mode);
      this.resetError();
    } catch (error) {
      const cause = Crash.from(error);
      const crash = new Crash(`Error copying file`, { cause });
      this.addError(crash);
      throw crash;
    }
  }

  /**
   * Moves a file from the source path to the destination path.
   * If the move operation fails, an error is thrown and logged.
   *
   * @param source - The path of the file to be moved.
   * @param destination - The destination path where the file will be moved to.
   */
  public moveFile(source: string, destination: string): void {
    try {
      fs.renameSync(source, destination);
      this.resetError();
    } catch (error) {
      const cause = Crash.from(error);
      const crash = new Crash(`Error moving file`, { cause });
      this.addError(crash);
      throw crash;
    }
  }

  /**
   * Reads a file from the specified path.
   *
   * @param path - The path of the file to read.
   * @param options - The options for reading the file (optional). If not provided, the default
   * read options are used. Otherwise, the provided options are merged with the default ones.
   * @returns The content of the file as a string or a Buffer
   */
  public readFile(path: string, options?: ReadOptions): string | Buffer {
    try {
      const mergedOptions: ReadOptions = _.merge(_.cloneDeep(this.options.readOptions), options);
      const data = fs.readFileSync(path, mergedOptions);
      this.resetError();
      return data;
    } catch (error) {
      const cause = Crash.from(error);
      const crash = new Crash(`Error reading file`, { cause });
      this.addError(crash);
      throw crash;
    }
  }

  /**
   * Reads the contents of a directory.
   *
   * @param path - The path of the directory to read.
   * @param options - The options for reading the directory (optional).
   * @returns An array of strings, buffers, or fs.Dirent objects representing the contents of the directory.
   */
  public readDirectory(path: string, options?: ReadDirOptions): string[] | Buffer[] {
    try {
      const mergedOptions: ReadDirOptions = _.merge(
        _.cloneDeep(this.options.readDirOptions),
        options
      );
      const result = fs.readdirSync(path, mergedOptions);
      this.resetError();
      return result;
    } catch (error) {
      const cause = Crash.from(error);
      const crash = new Crash(`Error reading directory`, { cause });
      this.addError(crash);
      throw crash;
    }
  }
}
