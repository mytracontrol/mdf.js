/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import Debug, { Debugger } from 'debug';
import Joi from 'joi';
import { transports } from 'winston';
import { jsonFormat, stringFormat } from '../formats';
import { LogLevel, LOG_LEVELS } from '../types';
const { File } = transports;

const DEFAULT_ENABLED_STATE = false;
const DEFAULT_LOG_LEVEL = 'info';
const DEFAULT_FILE_NAME = 'logs/mdf-app.log';
const DEFAULT_MAX_FILES = 10;
const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024;
const DEFAULT_ZIP_FILES = false;
const DEFAULT_JSON_FORMAT = false;

/** Winston File transport instance interface */
type FileTransportInterface = transports.FileTransportInstance;
/** File transport configuration interface */
export interface FileTransportConfig {
  /** File transport enabled, default: false */
  enabled?: boolean;
  /** File log level, default: info */
  level?: LogLevel;
  /** Log file name, default: logs/netin-app.log */
  filename?: string;
  /** Max number of files, default: 10 */
  maxFiles?: number;
  /** Max file size, default: 10 Mb */
  maxsize?: number;
  /** Store in zipped format, default: false*/
  zippedArchive?: boolean;
  /** Store in JSON format, default: false */
  json?: boolean;
}
/** File transport validation schema */
export const FileTransportSchema = Joi.object<FileTransportConfig>({
  enabled: Joi.boolean().default(DEFAULT_ENABLED_STATE),
  level: Joi.string()
    .allow(...LOG_LEVELS)
    .default(DEFAULT_LOG_LEVEL),
  filename: Joi.string().default(DEFAULT_FILE_NAME),
  maxFiles: Joi.number().default(DEFAULT_MAX_FILES),
  maxsize: Joi.number().default(DEFAULT_MAX_FILE_SIZE),
  zippedArchive: Joi.boolean().default(DEFAULT_ZIP_FILES),
  json: Joi.boolean().default(DEFAULT_JSON_FORMAT),
}).default();

/** File transport management class */
export class FileTransport {
  /** Debug logger for development and deep troubleshooting */
  #debug: Debugger;
  /** Default transport config */
  readonly #defaultConfig: FileTransportConfig = FileTransportSchema.validate({})
    .value as FileTransportConfig;
  /** Transport configuration */
  readonly #config: FileTransportConfig;
  /** Transport instance */
  readonly #instance: FileTransportInterface;
  /**
   * Create a file transport instance
   * @param label - Logger label
   * @param uuid - uuid of the logger instance
   * @param configuration - Transport config
   */
  constructor(label: string, uuid: string, configuration?: FileTransportConfig) {
    // Stryker disable all
    this.#debug = Debug('mms:logger:file');
    this.#debug(`${process.pid} - Configuration in the constructor %O`, configuration);
    // Stryker enable all
    const validation = FileTransportSchema.validate(configuration);
    if (validation.error) {
      // Stryker disable next-line all
      this.#debug(`${process.pid} - Error in the configuration, default will be applied`);
      this.#config = this.#defaultConfig;
    } else {
      this.#config = validation.value;
    }
    // Stryker disable next-line all
    this.#debug(`${process.pid} - Final configuration %O`, this.#config);
    const fileFormat = this.#config.json ? jsonFormat(label) : stringFormat(label);
    this.#instance = new File({
      format: fileFormat,
      silent: !this.#config.enabled,
      level: this.#config.level,
      filename: this.#config.filename,
      maxsize: this.#config.maxsize,
      maxFiles: this.#config.maxFiles,
      zippedArchive: this.#config.zippedArchive,
    });
  }
  /** Transport configuration */
  get config(): FileTransportConfig {
    return this.#config;
  }
  /** File mode transport instance */
  get transport(): FileTransportInterface {
    return this.#instance;
  }
}
