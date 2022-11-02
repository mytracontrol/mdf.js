/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Boom, Crash, Multi } from '@mdf.js/crash';

export type LoggerFunction = (
  message: string,
  uuid?: string,
  context?: string,
  ...meta: any[]
) => void;
export interface LoggerInstance {
  /**
   * Log events in the SILLY level: all the information in a very detailed way.
   * This level used to be necessary only in the development process, and the meta data used to be
   * the results of the operations.
   * @param message - human readable information to log
   * @param uuid - unique identifier for the actual job/task/request process
   * @param context - context (class/function) where this logger is logging
   * @param meta - extra information
   */
  silly: LoggerFunction;
  /**
   * Log events in the DEBUG level: all the information in a detailed way.
   * This level used to be necessary only in the debugging process, so not all the data is
   * reported, only the related with the main processes and tasks.
   * @param message - human readable information to log
   * @param uuid - unique identifier for the actual job/task/request process
   * @param context - context (class/function) where this logger is logging
   * @param meta - extra information
   */
  debug: LoggerFunction;
  /**
   * Log events in the VERBOSE level: trace information without details.
   * This level used to be necessary only in system configuration process, so information about
   * the settings and startup process used to be reported.
   * @param message - human readable information to log
   * @param uuid - unique identifier for the actual job/task/request process
   * @param context - context (class/function) where this logger is logging
   * @param meta - extra information
   */
  verbose: LoggerFunction;
  /**
   * Log events in the INFO level: only relevant events are reported.
   * This level is the default level.
   * @param message - human readable information to log
   * @param uuid - unique identifier for the actual job/task/request process
   * @param context - context (class/function) where this logger is logging
   * @param meta - extra information
   */
  info: LoggerFunction;
  /**
   * Log events in the WARN level: information about possible problems or dangerous situations.
   * @param message - human readable information to log
   * @param uuid - unique identifier for the actual job/task/request process
   * @param context - context (class/function) where this logger is logging
   * @param meta - extra information
   */
  warn: LoggerFunction;
  /**
   * Log events in the ERROR level: all the errors and problems with detailed information.
   * @param message - human readable information to log
   * @param uuid - unique identifier for the actual job/task/request process
   * @param context - context (class/function) where this logger is logging
   * @param meta - extra information
   */
  error: LoggerFunction;
  /**
   * Log events in the ERROR level: all the information in a very detailed way.
   * This level used to be necessary only in the development process.
   * @param error - crash error instance
   * @param context - context (class/function) where this logger is logging
   */
  crash: (error: Crash | Boom | Multi, context?: string) => void;
}
