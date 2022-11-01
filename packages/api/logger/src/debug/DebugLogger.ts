/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 * Note: All information contained herein is, and remains the property of Mytra Control S.L. and its
 * suppliers, if any. The intellectual and technical concepts contained herein are property of
 * Mytra Control S.L. and its suppliers and may be covered by European and Foreign patents, patents
 * in process, and are protected by trade secret or copyright.
 *
 * Dissemination of this information or the reproduction of this material is strictly forbidden
 * unless prior written permission is obtained from Mytra Control S.L.
 */

import { Boom, Crash, Multi } from '@mdf.js/crash';
import Debug, { Debugger } from 'debug';
import { LoggerFunction, LoggerInstance } from '../types';

export class DebugLogger implements LoggerInstance {
  /** Debug logger*/
  private readonly logger: Debugger;
  /**
   * Creates a new instance of the default logger
   * @param name - Name of the provider
   */
  constructor(private readonly name: string) {
    this.logger = Debug(this.name);
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
  silly: LoggerFunction = (message: string, uuid?: string, context?: string, ...meta: any[]) => {
    this.logger.extend('silly')(message);
    for (const entry of meta) {
      if (typeof entry === 'object' && entry !== null && !Array.isArray(entry)) {
        this.logger.extend('silly')('o%', entry);
      }
    }
  };
  /**
   * Log events in the DEBUG level: all the information in a detailed way.
   * This level used to be necessary only in the debugging process, so not all the data is
   * reported, only the related with the main processes and tasks.
   * @param message - human readable information to log
   * @param uuid - unique identifier for the actual job/task/request process
   * @param context - context (class/function) where this logger is logging
   * @param meta - extra information
   */
  debug: LoggerFunction = (message: string, uuid?: string, context?: string, ...meta: any[]) => {
    this.logger.extend('debug')(message);
  };
  /**
   * Log events in the VERBOSE level: trace information without details.
   * This level used to be necessary only in system configuration process, so information about
   * the settings and startup process used to be reported.
   * @param message - human readable information to log
   * @param uuid - unique identifier for the actual job/task/request process
   * @param context - context (class/function) where this logger is logging
   * @param meta - extra information
   */
  verbose: LoggerFunction = (message: string, uuid?: string, context?: string, ...meta: any[]) => {
    this.logger.extend('verbose')(message);
  };
  /**
   * Log events in the INFO level: only relevant events are reported.
   * This level is the default level.
   * @param message - human readable information to log
   * @param uuid - unique identifier for the actual job/task/request process
   * @param context - context (class/function) where this logger is logging
   * @param meta - extra information
   */
  info: LoggerFunction = (message: string, uuid?: string, context?: string, ...meta: any[]) => {
    this.logger.extend('info')(message);
  };
  /**
   * Log events in the WARN level: information about possible problems or dangerous situations.
   * @param message - human readable information to log
   * @param uuid - unique identifier for the actual job/task/request process
   * @param context - context (class/function) where this logger is logging
   * @param meta - extra information
   */
  warn: LoggerFunction = (message: string, uuid?: string, context?: string, ...meta: any[]) => {
    this.logger.extend('warn')(message);
  };
  /**
   * Log events in the ERROR level: all the errors and problems with detailed information.
   * @param message - human readable information to log
   * @param uuid - unique identifier for the actual job/task/request process
   * @param context - context (class/function) where this logger is logging
   * @param meta - extra information
   */
  error: LoggerFunction = (message: string, uuid?: string, context?: string, ...meta: any[]) => {
    this.logger.extend('error')(message);
  };
  /**
   * Log events in the ERROR level: all the information in a very detailed way.
   * This level used to be necessary only in the development process.
   * @param rawError - crash error instance
   * @param context - context (class/function) where this logger is logging
   */
  crash = (rawError: Crash | Boom | Multi, context?: string) => {
    const error = Crash.from(rawError);
    for (const entry of error.trace()) {
      this.logger.extend('error')(entry);
    }
  };
}
