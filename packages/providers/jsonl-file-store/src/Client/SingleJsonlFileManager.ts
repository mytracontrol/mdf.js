import { Crash } from '@mdf.js/crash';
import { LoggerInstance, SetContext } from '@mdf.js/logger';
import { Limiter, Single } from '@mdf.js/tasks';
import EventEmitter from 'events';
import fs from 'fs';
import path from 'path';
import { v4 } from 'uuid';
import { SingleJsonlFileManagerOptions } from './types';

export class SingleJsonlFileManager extends EventEmitter {
  /** Unique identifier */
  private readonly uuid: string = v4();
  /** Logger instance for deep debugging tasks */
  private readonly logger: LoggerInstance;
  /** The name of the current file being managed by the JsonlFileStoreManager */
  private currentFileName: string | undefined;
  /** Timer for file rotation */
  private _rotationTimer: NodeJS.Timeout | undefined;
  /** The file stream for the current file being managed by the JsonlFileStoreManager */
  private currentFileStream: fs.WriteStream | null = null;
  /** Limiter instance for managing concurrent operations */
  private limiter: Limiter;

  /**
   * Creates a new instance of the file manager
   * @param name - Service name
   * @param options - Service setup options
   * @param logger - Logger instance (optional)
   */
  constructor(
    private readonly name: string,
    readonly options: SingleJsonlFileManagerOptions,
    logger: LoggerInstance
  ) {
    super();
    this.logger = SetContext(logger, this.name, this.uuid);
    this.limiter = new Limiter({
      concurrency: 1,
      autoStart: true,
    });
  }

  /** Gets the rotation timer for the single file manager */
  public get rotationTimer(): NodeJS.Timeout | undefined {
    return this._rotationTimer;
  }

  /** Sets the rotation timer for the single file manager */
  public set rotationTimer(value: NodeJS.Timeout | undefined) {
    this._rotationTimer = value;
  }

  /**
   * Appends data to the file store.
   * This method uses the Limiter to ensure only one file operation is executed
   * at a time (concurrency=1) and to retry the append operation if necessary
   * @param data - The data to append to the file.
   * @returns A promise that resolves when the append operation is complete.
   */
  public append(data: string): Promise<void> {
    const appendTask = async () => {
      try {
        await this.appendData(data);
        if (!this._rotationTimer) {
          this._rotationTimer = setTimeout(this.rotate, this.options.rotationInterval);
        }
      } catch (error) {
        const cause = Crash.from(error);
        throw new Crash(`Error appending data`, { cause });
      }
    };
    return this.limiter.execute(
      new Single(appendTask, { retryOptions: this.options.appendRetryOptions })
    );
  }

  /**
   * Appends data to the current file stream.
   * @param data - The data to append to the file.
   * @returns A promise that resolves when the data has been appended.
   */
  private appendData = async (data: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        if (!this.currentFileStream) {
          this.currentFileName = this.generateNewOpenFileName();
          const openFilePath = path.join(this.options.openFilesFolderPath, this.currentFileName);
          this.currentFileStream = fs.createWriteStream(openFilePath, { flags: 'a' });
        }
        this.currentFileStream.write(data, this.options.fileEncoding, err => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  };

  /**
   * Rotates the current file
   * This method uses the Limiter to ensure only one file operation is executed
   * at a time (concurrency=1) and to retry the rotate operation if necessary
   */
  private rotate = async (): Promise<void> => {
    try {
      await this.limiter.execute(
        new Single(this.rotateFile, { retryOptions: this.options.rotationRetryOptions })
      );
    } catch (error) {
      const cause = Crash.from(error);
      this.emit('error', new Crash(`Rotation error`, { cause }));
    } finally {
      clearTimeout(this._rotationTimer);
      this._rotationTimer = undefined;
      this.currentFileName = undefined;
      this.currentFileStream = null;
    }
  };

  /**
   * Rotates the current file by renaming it
   * @returns A promise that resolves when the file rotation is complete.
   */
  private rotateFile = async (): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      const streamEnd = () => {
        if (this.currentFileName) {
          try {
            const openFilePath = path.join(this.options.openFilesFolderPath, this.currentFileName);
            const closedFilePath = path.join(
              this.options.closedFilesFolderPath,
              this.currentFileName
            );
            fs.renameSync(openFilePath, closedFilePath);
            resolve();
          } catch (error) {
            const cause = Crash.from(error);
            reject(new Crash(`Error rotating file`, { cause }));
          }
        } else {
          reject(new Crash(`Error rotating file: File name is not valid`));
        }
      };

      if (this.currentFileStream) {
        this.currentFileStream.end(streamEnd);
      } else {
        reject(new Crash(`Error rotating file: No file stream to rotate`));
      }
    });
  };

  /**
   * Generates a new file name based on the current timestamp.
   * @returns The generated file name in the format `data_<timestamp>`.
   */
  private generateNewOpenFileName(): string {
    const timestamp = this.getFormattedTimestamp(new Date());
    return `${this.options.baseFilename}_${timestamp}`;
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
}
