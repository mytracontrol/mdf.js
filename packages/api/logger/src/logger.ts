/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Boom, Crash, Multi } from '@mdf.js/crash';
import Debug, { Debugger } from 'debug';
import fs from 'fs';
import Joi from 'joi';
import { v4 } from 'uuid';
import winston from 'winston';
import { ConsoleTransport, ConsoleTransportConfig, ConsoleTransportSchema } from './console';
import { FileTransport, FileTransportConfig, FileTransportSchema } from './file';
import { FluentdTransport, FluentdTransportConfig, FluentdTransportSchema } from './fluentd';
import { LoggerInstance } from './types';

/** Logger transports configuration interface */
export interface LoggerConfig {
  console?: ConsoleTransportConfig;
  file?: FileTransportConfig;
  fluentd?: FluentdTransportConfig;
}
/** Logger transports validation schema */
export const LoggerSchema = Joi.object<LoggerConfig>({
  console: ConsoleTransportSchema.optional(),
  file: FileTransportSchema.optional(),
  fluentd: FluentdTransportSchema.optional(),
}).default();

/** Class Logger, manage the event and log register process for netin artifacts */
export class Logger implements LoggerInstance {
  /** Debug logger for development and deep troubleshooting */
  private readonly _debug: Debugger;
  /** Default config */
  private readonly defaultConfig: LoggerConfig = LoggerSchema.validate({}).value as LoggerConfig;
  /** Actual logger configuration */
  private _config: LoggerConfig;
  /** Logger de context dentro de Winston */
  private readonly logger: winston.Logger;
  /** Transports */
  private transports: winston.transport[] = [];
  /** Number of actual configured transports */
  private numberOfTransports = 0;
  /** Actual process id */
  private readonly pid = process.pid.toString();
  /** Logger configuration was wrong flag */
  private errorInConfig = false;
  /** Error in the configuration */
  private _configError: Multi | undefined;
  /** Logger instance UUID */
  private readonly uuid = v4();
  /** Flag that indicate if the component is running in a docker instance */
  private _isDocker: boolean | undefined;
  /** Create a netin logger instance with default values */
  constructor();
  /**
   * Create a netin logger instance with default values
   * @param label - logger label
   */
  constructor(label: string);
  /**
   * Create a netin logger instance with default values
   * @param label - logger label
   * @param configuration - logger configuration
   */
  constructor(label: string, configuration?: LoggerConfig);
  constructor(
    private label = 'mdf-app',
    configuration?: LoggerConfig
  ) {
    // Stryker disable all
    this._debug = Debug('mdf:logger');
    this._debug(`${process.pid} - New instance of logger for ${label}`);
    this._debug(`${process.pid} - Configuration in the constructor %O`, configuration);
    // Stryker enable all
    this._config = this.initialize(label, configuration);
    this.numberOfTransports = this.transports.length;
    // Stryker disable next-line all
    this._debug(`${process.pid} - Number of transports configured ${this.numberOfTransports}`);
    this.logger = winston.createLogger({
      transports: [...this.transports],
    });
    if (this.errorInConfig && this._configError) {
      this.error(this._configError.message, this.uuid, 'logger', this._configError);
    }
  }
  /**
   * Establish the logger configuration
   * @param label - Logger label
   * @param configuration - logger configuration
   */
  private initialize(label: string, configuration?: LoggerConfig): LoggerConfig {
    const validation = LoggerSchema.validate(configuration);
    if (validation.error) {
      // Stryker disable next-line all
      this._debug(`${process.pid} - Error in the configuration, default will be applied`);
      this._configError = new Multi(`Logger configuration Error`, this.uuid);
      this._configError.Multify(validation.error);
      this.errorInConfig = true;
      // Stryker disable next-line all
      this._debug(`${process.pid} - Error: %O`, this._configError.toJSON());
      this._config = this.defaultConfig;
    } else {
      // Stryker disable next-line all
      this._debug(`${process.pid} - The configuration is valid`);
      this.label = label;
      this._config = validation.value;
    }
    this.atLeastOne(this._config, configuration);
    // Stryker disable next-line all
    this._debug(`${process.pid} - Final configuration %O`, this._config);
    if (this._config.file) {
      this.setFileTransport(label, this._config.file);
    }
    if (this._config.console) {
      this.setConsoleTransport(label, this._config.console);
    }
    if (this._config.fluentd) {
      this.setFluentdTransport(label, this._config.fluentd);
    }
    return this._config;
  }
  /**
   * Establish the logger configuration
   * @param label - Logger label
   * @param configuration - logger configuration
   */
  public setConfig(label: string, configuration: LoggerConfig): void {
    // Stryker disable next-line all
    this._debug(`${process.pid} - Setting the configuration by the process`);
    if (this.numberOfTransports > 0) {
      // Stryker disable next-line all
      this._debug(`${process.pid} - The are ${this.numberOfTransports} transport to remove`);
      this.logger.transports.forEach(transport => {
        this.logger.remove(transport);
      });
      this.transports = [];
    }
    this._config = this.initialize(label, configuration);
    this.numberOfTransports = this.transports.length;
    // Stryker disable next-line all
    this._debug(`${process.pid} - Number of transports configured ${this.numberOfTransports}`);
    this.transports.forEach(transport => this.logger.add(transport));
  }
  /**
   * Establish the file transport configuration
   * @param label - Logger label
   * @param configuration - logger configuration
   */
  private setFileTransport(label: string, config: FileTransportConfig): void {
    if (config.enabled) {
      const _file = new FileTransport(label, this.uuid, config);
      if (_file.transport) {
        this.transports.push(_file.transport);
      }
    }
  }
  /**
   * Establish the console transport configuration
   * @param label - Logger label
   * @param configuration - logger configuration
   */
  private setConsoleTransport(label: string, config: ConsoleTransportConfig): void {
    if (config.enabled) {
      const _console = new ConsoleTransport(label, this.uuid, config);
      if (_console.transport) {
        this.transports.push(_console.transport);
      }
    }
  }
  /**
   * Establish the fluentd transport configuration
   * @param label - Logger label
   * @param config - logger configuration
   */
  private setFluentdTransport(label: string, config: FluentdTransportConfig): void {
    if (config.enabled) {
      const _fluentd = new FluentdTransport(label, this, this.uuid, config);
      if (_fluentd.transport) {
        this.transports.push(_fluentd.transport);
      }
    }
  }
  /**
   * Log events in the SILLY level: all the information in a very detailed way.
   * This level used to be necessary only in the development process, and the meta data used to be
   * the results of the operations.
   * @param message - human readable information to log
   * @param uuid - unique identifier for the actual job/task/request process
   * @param context - context (class/function) where this logger is logging
   * @param meta - extra information
   */
  silly(message: string, uuid?: string, context?: string, ...meta: any[]): void {
    if (this.numberOfTransports > 0) {
      this.logger.silly(message, {
        timestamp: new Date().toISOString(),
        pid: this.pid,
        uuid,
        context,
        meta,
      });
    }
  }
  /**
   * Log events in the DEBUG level: all the information in a detailed way.
   * This level used to be necessary only in the debugging process, so not all the data is
   * reported, only the related with the main processes and tasks.
   * @param message - human readable information to log
   * @param uuid - unique identifier for the actual job/task/request process
   * @param context - context (class/function) where this logger is logging
   * @param meta - extra information
   */
  debug(message: string, uuid?: string, context?: string, ...meta: any[]): void {
    if (this.numberOfTransports > 0) {
      this.logger.debug(message, {
        timestamp: new Date().toISOString(),
        pid: this.pid,
        uuid,
        context,
        meta,
      });
    }
  }
  /**
   * Log events in the VERBOSE level: trace information without details.
   * This level used to be necessary only in system configuration process, so information about
   * the settings and startup process used to be reported.
   * @param message - human readable information to log
   * @param uuid - unique identifier for the actual job/task/request process
   * @param context - context (class/function) where this logger is logging
   * @param meta - extra information
   */
  verbose(message: string, uuid?: string, context?: string, ...meta: any[]): void {
    if (this.numberOfTransports > 0) {
      this.logger.verbose(message, {
        timestamp: new Date().toISOString(),
        pid: this.pid,
        uuid,
        context,
        meta,
      });
    }
  }
  /**
   * Log events in the INFO level: only relevant events are reported.
   * This level is the default level.
   * @param message - human readable information to log
   * @param uuid - unique identifier for the actual job/task/request process
   * @param context - context (class/function) where this logger is logging
   * @param meta - extra information
   */
  info(message: string, uuid?: string, context?: string, ...meta: any[]): void {
    if (this.numberOfTransports > 0) {
      this.logger.info(message, {
        timestamp: new Date().toISOString(),
        pid: this.pid,
        uuid,
        context,
        meta,
      });
    }
  }
  /**
   * Log events in the WARN level: information about possible problems or dangerous situations.
   * @param message - human readable information to log
   * @param uuid - unique identifier for the actual job/task/request process
   * @param context - context (class/function) where this logger is logging
   * @param meta - extra information
   */
  warn(message: string, uuid?: string, context?: string, ...meta: any[]): void {
    if (this.numberOfTransports > 0) {
      this.logger.warn(message, {
        timestamp: new Date().toISOString(),
        pid: this.pid,
        uuid,
        context,
        meta,
      });
    }
  }
  /**
   * Log events in the ERROR level: all the errors and problems with detailed information.
   * @param message - human readable information to log
   * @param uuid - unique identifier for the actual job/task/request process
   * @param context - context (class/function) where this logger is logging
   * @param meta - extra information
   */
  error(message: string, uuid?: string, context?: string, ...meta: any[]): void {
    if (this.numberOfTransports > 0) {
      this.logger.error(message, {
        timestamp: new Date().toISOString(),
        pid: this.pid,
        uuid,
        context,
        meta,
      });
    }
  }
  /**
   * Log events in the ERROR level: all the information in a very detailed way.
   * This level used to be necessary only in the development process.
   * @param error - crash error instance
   * @param context - context (class/function) where this logger is logging
   */
  crash(error: Crash | Boom | Multi, context?: string): void {
    if (this.numberOfTransports > 0) {
      this.logger.error(error.message, {
        timestamp: new Date().toISOString(),
        pid: this.pid,
        uuid: error.uuid,
        context,
        cause: error.toJSON(),
        info: error.info,
      });
    }
  }
  /** Stream de escritura del propio logger */
  get stream(): { write: (str: string) => void } {
    const _pid = this.pid;
    const _label = this.label;
    const _logger = this.logger;
    return {
      write: function (message: string): void {
        const jsonObject = JSON.parse(message);
        jsonObject['pid'] = _pid;
        jsonObject['label'] = _label;
        _logger.log(jsonObject);
      },
    };
  }
  /** Logger config */
  get config(): LoggerConfig {
    return this._config;
  }
  /** Logger configuration error flag */
  get hasError(): boolean {
    return this.errorInConfig;
  }
  /** Logger configuration errors, if exist */
  get configError(): Multi | undefined {
    return this._configError;
  }
  /** Determine if the component is running in a docker instance or not */
  private isDocker(): boolean {
    if (this._isDocker === undefined) {
      let hasDockerEnv = true;
      let hasDockerCGroup = true;
      try {
        fs.statSync('./.dockerenv');
      } catch (error) {
        hasDockerEnv = false;
      }
      try {
        return fs.readFileSync('/proc/self/cgroup', 'utf8').includes('docker');
      } catch (error) {
        hasDockerCGroup = false;
      }
      this._isDocker = hasDockerEnv || hasDockerCGroup;
    }
    return this._isDocker;
  }
  /**
   * Set at least one transport to true if no transport is set but a configuration has been
   * indicated
   * @param finalConfig - Final configuration
   * @param configuration - Initial configuration
   */
  private atLeastOne(finalConfig: LoggerConfig, configuration?: LoggerConfig): void {
    if (finalConfig.console?.enabled || finalConfig.file?.enabled || finalConfig.fluentd?.enabled) {
      return;
    }
    if (configuration !== undefined) {
      // Stryker disable next-line all
      this._debug(`Configuration error with not empty configuration: %O`, configuration);
      if (this.isDocker()) {
        // Stryker disable next-line all
        this._debug(`Running in docker instance, console will be enabled`);
        finalConfig.console = { enabled: true };
      } else {
        // Stryker disable next-line all
        this._debug(`Running in a NOT docker instance, file will be enabled`);
        finalConfig.file = { enabled: true };
      }
    }
  }
}
