/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash, Multi } from '@mdf.js/crash';
import { DebugLogger, SetContext, type LoggerInstance } from '@mdf.js/logger';
import { Group, RETRY_STRATEGY, Sequence, Single } from '@mdf.js/tasks';
import { execFile, type ExecFileException } from 'child_process';
import {
  createReadStream,
  createWriteStream,
  ReadStream,
  renameSync,
  unlinkSync,
  WriteStream,
} from 'fs';
import { merge } from 'lodash';
import os from 'os';
import path from 'path';
import { pipeline } from 'stream';
import { v4 } from 'uuid';
import { createGzip } from 'zlib';
import type { Pusher } from '../pusher';
import {
  DEFAULT_FILE_TASKS_OPTIONS,
  ERROR_STRATEGIES,
  ErroredFile,
  ErrorStrategy,
  FileTaskIdentifiers,
  POST_PROCESSING_STRATEGIES,
  PostProcessingStrategy,
  type FileTasksOptions,
} from './types';

/** File tasks to process files */
export class FileTasks {
  /** File task options */
  private readonly options: FileTasksOptions;
  /** Debug logger for development and deep troubleshooting */
  private readonly logger: LoggerInstance;
  /** Error strategy */
  private readonly errorStrategy: ErrorStrategy;
  /** Post-processing strategy */
  private readonly postProcessingStrategy: PostProcessingStrategy;
  /** Errored file tracks */
  public readonly erroredFiles: Map<string, ErroredFile> = new Map();
  /**
   * Create a new instance of the file tasks.
   * @param options - The file task options
   */
  constructor(options: FileTasksOptions, logger?: LoggerInstance) {
    this.options = merge({}, DEFAULT_FILE_TASKS_OPTIONS, options);
    // Stryker disable next-line all
    this.logger = SetContext(
      logger || new DebugLogger(`mdf:fileFlinger:engine:fileTasks`),
      'fileTasks',
      v4()
    );
    this.errorStrategy = this.options.errorStrategy ?? ErrorStrategy.IGNORE;
    this.postProcessingStrategy =
      this.options.postProcessingStrategy ?? PostProcessingStrategy.DELETE;
    if (this.options.pushers.length < 1) {
      throw new Crash(`FileFlinger must have at least one pusher`);
    }
    if (!POST_PROCESSING_STRATEGIES.includes(this.postProcessingStrategy)) {
      throw new Crash(`Unknown post-processing strategy: ${this.postProcessingStrategy}`);
    }
    if (
      this.postProcessingStrategy !== PostProcessingStrategy.DELETE &&
      !this.options.archiveFolder
    ) {
      throw new Crash(
        `FileFlinger must have an archive folder if postProcessingStrategy is not DELETE`
      );
    }
    if (!ERROR_STRATEGIES.includes(this.errorStrategy)) {
      throw new Crash(`Unknown error strategy: ${this.errorStrategy}`);
    }
    if (this.errorStrategy === ErrorStrategy.DEAD_LETTER && !this.options.deadLetterFolder) {
      throw new Crash(`FileFlinger must have a dead-letter folder if onKeyingError is DEAD_LETTER`);
    }
  }
  /**
   * Get the task to process the file.
   * @param filePath - The path of the file to process
   * @param key - The key to use for the file
   * @returns The task to process the file
   */
  public getProcessFileTask(filePath: string, key: string): Sequence<any, FileTasks> {
    this.logger.debug(
      `Processing file [${filePath}] with key [${key}] using [${this.options.pushers.map(p => p.name).join(', ')}]`
    );
    return new Sequence<any, FileTasks>(
      { task: this.getPushTasks(filePath, key), post: [this.selectPostProcessTask(filePath)] },
      {
        bind: this,
        id: key,
        retryOptions: { ...this.options.retryOptions, attempts: 1 },
        retryStrategy: RETRY_STRATEGY.NOT_EXEC_AFTER_SUCCESS,
      }
    );
  }
  /**
   * Get the task to process the errored file based on the error strategy.
   * @param filePath - The path of the file to process
   * @param error - The error to process
   * @returns The task to process the errored file
   */
  public getProcessErroredFileTask(filePath: string, error: unknown): Single<void, FileTasks> {
    this.logger.debug(`Processing errored file [${filePath}}]`);
    return new Single(this.processErroredFile, [filePath, error], {
      id: FileTaskIdentifiers.ERRORED,
      bind: this,
      retryOptions: { ...this.options.retryOptions, attempts: 1 },
    });
  }
  /**
   * Select the post-process task based on the options.
   * @param filePath - The path of the file to process
   * @returns The post-process task
   */
  private selectPostProcessTask(filePath: string): Single<void, FileTasks> {
    this.logger.debug(
      `Selecting post-processing task for file [${filePath}], strategy: [${this.postProcessingStrategy}]`
    );
    switch (this.postProcessingStrategy) {
      case PostProcessingStrategy.ARCHIVE:
        return this.getArchiveTask(filePath, this.options.archiveFolder as string);
      case PostProcessingStrategy.ZIP:
        return this.getZipTask(filePath, this.options.archiveFolder as string);
      case PostProcessingStrategy.DELETE:
      default:
        return this.getDeleteTask(filePath);
    }
  }
  /**
   * Get the group of tasks to process the file.
   * @param filePath - The path of the file to process
   * @param key - The key to use for the file
   * @returns The group of tasks to process the file
   */
  private getPushTasks(filePath: string, key: string): Group<void, FileTasks> {
    this.logger.debug(`Getting push tasks for file [${filePath}] with key [${key}]`);
    const pushTasks: Single<void, FileTasks>[] = [];
    for (const pusher of this.options.pushers) {
      pushTasks.push(
        new Single(this.push, [filePath, key, pusher], {
          id: FileTaskIdentifiers.PUSH,
          bind: this,
          retryOptions: { ...this.options.retryOptions, attempts: 1 },
          retryStrategy: RETRY_STRATEGY.NOT_EXEC_AFTER_SUCCESS,
        })
      );
    }
    return new Group(pushTasks, {
      id: 'push',
      retryOptions: { attempts: 1 },
      retryStrategy: RETRY_STRATEGY.NOT_EXEC_AFTER_SUCCESS,
    });
  }
  /**
   * Get the task to archive the file to the destination folder.
   * @param filePath - The path of the file to archive
   * @param destination - The destination folder path
   * @returns The task to archive the file
   */
  private getArchiveTask(filePath: string, destination: string): Single<void, FileTasks> {
    this.logger.debug(`Getting archive task for file [${filePath}] to [${destination}]`);
    return new Single(this.archiveFile, [filePath, destination], {
      id: FileTaskIdentifiers.ARCHIVE,
      bind: this,
      retryOptions: { ...this.options.retryOptions, attempts: 1 },
    });
  }
  /**
   * Get the task to zip the file and move it to the destination folder.
   * Deletes the original file after zipping.
   * @param filePath - The path of the file to zip
   * @param destination - The destination folder path
   * @returns The task to zip the file
   */
  private getZipTask(filePath: string, destination: string): Single<void, FileTasks> {
    this.logger.debug(`Getting zip task for file [${filePath}] to [${destination}]`);
    return new Single(this.zipFile, [filePath, destination], {
      id: FileTaskIdentifiers.ZIP,
      bind: this,
      retryOptions: { ...this.options.retryOptions, attempts: 1 },
    });
  }
  /**
   * Get the task to delete the file from the file system.
   * @param filePath - The path of the file to delete
   * @returns The task to delete the file
   */
  private getDeleteTask(filePath: string): Single<void, FileTasks> {
    this.logger.debug(`Getting delete task for file [${filePath}]`);
    return new Single(this.deleteFile, [filePath], {
      id: FileTaskIdentifiers.DELETE,
      bind: this,
      retryOptions: { ...this.options.retryOptions, attempts: 1 },
    });
  }
  /**
   * Push the file to the pusher and monitor the process.
   * @param filePath - The path of the file to process
   * @param key - The key to use for the file
   * @param pusher - The pusher to use
   */
  private async push(filePath: string, key: string, pusher: Pusher): Promise<void> {
    this.logger.debug(`Pushing file [${filePath}] to [${pusher.name}] with key [${key}]`);
    try {
      await pusher.push(filePath, key);
    } catch (rawError) {
      const cause = Crash.from(rawError, pusher.componentId);
      const error = new Crash(
        `Error pushing file ${filePath} to ${pusher.name}: ${cause.message}`,
        { cause }
      );
      this.logger.debug(error.message);
      throw error;
    }
  }
  /**
   * Delete the file from the file system.
   * @param filePath - The path of the file to process
   */
  private async deleteFile(filePath: string): Promise<void> {
    try {
      if (await this.isFileOpen(filePath)) {
        const error = new Crash(`File [${filePath}] is currently open and cannot be deleted`);
        this.logger.debug(error.message);
        throw error;
      }
      unlinkSync(filePath);
    } catch (rawError) {
      const cause = Crash.from(rawError);
      const error = new Crash(`Error deleting file ${filePath}: ${cause.message}`, { cause });
      this.logger.debug(error.message);
      throw error;
    }
  }
  /**
   * Archive the file to the destination folder.
   * @param filePath - The path of the file to archive
   * @param destination - The destination folder path
   */
  private async archiveFile(filePath: string, destination: string): Promise<void> {
    try {
      if (await this.isFileOpen(filePath)) {
        const error = new Crash(`File [${filePath}] is currently open and cannot be archived`);
        this.logger.debug(error.message);
        throw error;
      }
      renameSync(filePath, path.join(destination, path.basename(filePath)));
    } catch (rawError) {
      const cause = Crash.from(rawError);
      const error = new Crash(
        `Error archiving file [${filePath}] to [${destination}]: ${cause.message}`,
        { cause }
      );
      this.logger.debug(error.message);
      throw error;
    }
  }
  /**
   * Zips the file and moves it to the destination folder.
   * Deletes the original file after zipping.
   * @param filePath - The path of the file to zip
   * @param destination - The destination folder path
   */
  private async zipFile(filePath: string, destination: string): Promise<void> {
    if (await this.isFileOpen(filePath)) {
      const error = new Crash(`File [${filePath}] is currently open and cannot be zipped`);
      this.logger.debug(error.message);
      throw error;
    }
    return new Promise((resolve, reject) => {
      const zipFilePath = path.join(destination, `${path.basename(filePath)}.gz`);
      let readStream: ReadStream;
      let writeStream: WriteStream;
      try {
        readStream = createReadStream(filePath, 'utf8');
        writeStream = createWriteStream(zipFilePath);
      } catch (streamError) {
        const cause = Crash.from(streamError);
        const error = new Crash(`Error creating read/write streams: ${cause.message}`, { cause });
        this.logger.debug(error.message);
        reject(error);
        return;
      }
      const gZip = createGzip();
      pipeline(readStream, gZip, writeStream, rawError => {
        if (rawError) {
          const cause = Crash.from(rawError);
          const error = new Crash(`Error zipping file [${filePath}]: ${cause.message}`, { cause });
          this.logger.debug(error.message);
          reject(error);
        }
        resolve();
      });
    });
  }
  /**
   * Process the errored file based on the error strategy.
   * @param filePath - The path of the file to process
   */
  private async processErroredFile(filePath: string, error: unknown): Promise<void> {
    const filename = path.basename(filePath, path.extname(filePath));
    const errorTrack = new Multi(`Error processing file ${filename}`, {
      causes: [Crash.from(error)],
    });
    this.logger.debug(`Processing errored file [${filename}] with strategy: ${this.errorStrategy}`);
    try {
      switch (this.errorStrategy) {
        case ErrorStrategy.DELETE:
          await this.deleteFile(filePath);
          break;
        case ErrorStrategy.DEAD_LETTER:
          if (!this.options.deadLetterFolder) {
            throw new Crash(`Dead-letter strategy selected but no dead-letter folder provided`);
          }
          await this.archiveFile(filePath, this.options.deadLetterFolder);
          break;
        case ErrorStrategy.IGNORE:
        default:
          break;
      }
    } catch (rawError) {
      const cause = Crash.from(rawError);
      const error = new Crash(`Error processing file [${filename}]: ${cause.message}`, { cause });
      this.logger.debug(error.message);
      errorTrack.push(error);
    }
    this.erroredFiles.set(filename, {
      errorTrace: errorTrack.trace(),
      path: filePath,
      strategy: this.errorStrategy,
    });
  }
  /**
   * Detect if a file is currently open by any process.
   * Compatible with Unix and Windows systems.
   * @param filePath - The absolute path to the file.
   * @returns A promise that resolves to `true` if the file is open, or `false` otherwise.
   */
  private async isFileOpen(filePath: string): Promise<boolean> {
    this.logger.debug(`Checking if file [${filePath}] is open`);
    // Specific implementation according to the operating system
    if (os.type() === 'Windows_NT') {
      return this.isFileOpenWindows(filePath);
    } else {
      return this.isFileOpenUnix(filePath);
    }
  }
  /**
   * Check if a file is open in Unix systems using the 'lsof' command.
   * @param filePath - The absolute path to the file.
   * @returns A promise that resolves to `true` if the file is open, or `false` otherwise.
   */
  private async isFileOpenUnix(filePath: string): Promise<boolean> {
    this.logger.debug(`Checking if file [${filePath}] is open in Unix systems`);
    return new Promise((resolve, reject) => {
      execFile(
        'lsof',
        ['-F', 'n', '--', filePath],
        (error: ExecFileException | null, stdout: string, stderr: string) => {
          if (error) {
            // If 'lsof' exits with code 1 and no stderr, the file is not open
            if (error.code === 1 && !stderr) {
              resolve(false);
            }
            // Otherwise, an error occurred
            else {
              reject(new Crash(`Error checking file status with lsof: ${error.message}`));
            }
          } else {
            // If 'lsof' returns output, the file is open
            resolve(stdout.trim().length > 0);
          }
        }
      );
    });
  }
  /**
   * Check if a file is open in Windows using PowerShell commands.
   * @param filePath - The absolute path to the file.
   * @returns A promise that resolves to `true` if the file is open, or `false` otherwise.
   */
  private async isFileOpenWindows(filePath: string): Promise<boolean> {
    const powershellScript = `
    $filePath = "${filePath.replace(/"/g, '""')}";
    $file = Get-Item -LiteralPath $filePath -ErrorAction SilentlyContinue;
    if ($file -ne $null) {
      try {
        $stream = $file.Open([System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::None);
        $stream.Close();
        Write-Output "False";
      } catch {
        Write-Output "True";
      }
    } else {
      Write-Output "False";
    }
  `;
    return new Promise((resolve, reject) => {
      // PowerShell script to check if the file is open
      execFile(
        'powershell.exe',
        ['-NoProfile', '-Command', powershellScript],
        (error: ExecFileException | null, stdout: string, stderr: string) => {
          if (error) {
            reject(new Crash(`Error checking file status with PowerShell: ${error.message}`));
          } else {
            resolve(stdout.trim() === 'True');
          }
        }
      );
    });
  }
}
