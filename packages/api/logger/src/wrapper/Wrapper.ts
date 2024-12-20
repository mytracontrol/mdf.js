/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Boom, Crash, Multi } from '@mdf.js/crash';
import { v4 } from 'uuid';
import { LoggerFunction, LoggerInstance } from '../types';

export class WrapperLogger {
  /**
   * Create a wrapped version of the logger where the context and uuid are already set
   * @param logger - Logger instance to wrap
   * @param context - context (class/function) where this logger is logging
   * @param componentId - component identification
   */
  public constructor(
    private readonly logger: LoggerInstance,
    private readonly context: string,
    private readonly componentId: string = v4()
  ) {}
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
    this.logger.silly(message, uuid ?? this.componentId, context ?? this.context, ...meta);
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
    this.logger.debug(message, uuid ?? this.componentId, context ?? this.context, ...meta);
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
    this.logger.verbose(message, uuid ?? this.componentId, context ?? this.context, ...meta);
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
    this.logger.info(message, uuid ?? this.componentId, context ?? this.context, ...meta);
  };
  /**
   * Log events in the WARN level: information about possible problems or dangerous situations.
   * @param message - human readable information to log
   * @param uuid - unique identifier for the actual job/task/request process
   * @param context - context (class/function) where this logger is logging
   * @param meta - extra information
   */
  warn: LoggerFunction = (message: string, uuid?: string, context?: string, ...meta: any[]) => {
    this.logger.warn(message, uuid ?? this.componentId, context ?? this.context, ...meta);
  };
  /**
   * Log events in the ERROR level: all the errors and problems with detailed information.
   * @param message - human readable information to log
   * @param uuid - unique identifier for the actual job/task/request process
   * @param context - context (class/function) where this logger is logging
   * @param meta - extra information
   */
  error: LoggerFunction = (message: string, uuid?: string, context?: string, ...meta: any[]) => {
    this.logger.error(message, uuid ?? this.componentId, context ?? this.context, ...meta);
  };
  /**
   * Log events in the ERROR level: all the information in a very detailed way.
   * This level used to be necessary only in the development process.
   * @param rawError - crash error instance
   * @param context - context (class/function) where this logger is logging
   */
  crash = (rawError: Crash | Boom | Multi, context?: string) => {
    this.logger.crash(rawError, context ?? this.context);
  };
  /** Stream logger */
  stream: { write: (message: string) => void } = {
    write: (message: string) => {
      this.logger.stream.write(message);
    },
  };
}
/**
 * Create a wrapped version of the logger where the context and uuid are already set
 * @param logger - Logger instance to wrap
 * @param context - context (class/function) where this logger is logging
 * @param componentId - component identification
 * @returns
 */
export function SetContext(logger: LoggerInstance, context: string, componentId?: string) {
  return new WrapperLogger(logger, context, componentId);
}
