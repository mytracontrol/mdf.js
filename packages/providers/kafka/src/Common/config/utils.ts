/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { DebugLogger } from '@mdf.js/logger';
import { v4 } from 'uuid';
/** Base name for the kafka provider */
export const CONFIG_PROVIDER_BASE_NAME = 'kafka';
/** Artifact identifier for the configuration provider */
export const CONFIG_ARTIFACT_ID = `mdf-${CONFIG_PROVIDER_BASE_NAME}`;
/** Default Logger for the configuration provider */
export const logger = new DebugLogger(`mdf:${CONFIG_PROVIDER_BASE_NAME}:config`);

// *************************************************************************************************
// #region Logger configuration
export enum logLevel {
  NOTHING = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 4,
  DEBUG = 5,
}
export interface LogEntry {
  namespace: string;
  level: logLevel;
  label: string;
  log: LoggerEntryContent;
}
export interface LoggerEntryContent {
  readonly timestamp: string;
  readonly message: string;
  [key: string]: any;
}
export type logCreator = (logLevel: logLevel) => (entry: LogEntry) => void;

/**
 * Define the log level for the kafka provider, possible values are:
 * - `error`
 * - `warn`
 * - `info`
 * - `debug`
 * - `trace`
 * @defaultValue `error`
 */
export const CONFIG_KAFKA_LOG_LEVEL: string | logLevel =
  process.env['CONFIG_KAFKA_LOG_LEVEL'] || 'error';
const UUID = v4();

/**
 * Convert logger level to kafka log level
 * @param level - log level of logger
 * @returns
 */
export const selectLogLevel = (level: string): logLevel => {
  switch (level) {
    case 'error':
      return logLevel.ERROR;
    case 'warn':
      return logLevel.WARN;
    case 'info':
      return logLevel.INFO;
    case 'debug':
    case 'trace':
      return logLevel.DEBUG;
    default:
      return logLevel.NOTHING;
  }
};
export const CONFIG_KAFKA_CLIENT__LOG_LEVEL = selectLogLevel(CONFIG_KAFKA_LOG_LEVEL);
/**
 * Log creator function, used to log kafka events
 * @param level - configured log level
 * @returns
 */
export const defaultLogCreator: logCreator = (level: logLevel) => (entry: LogEntry) => {
  const { message, ...others } = entry.log;
  const logMessage = `${entry.label} - ${entry.namespace} - ${message}`;
  switch (level) {
    case logLevel.ERROR:
      logger.error(logMessage, UUID, 'Kafka', others);
      break;
    case logLevel.WARN:
      logger.warn(logMessage, UUID, 'Kafka', others);
      break;
    case logLevel.INFO:
      logger.info(logMessage, UUID, 'Kafka', others);
      break;
    case logLevel.DEBUG:
      logger.debug(logMessage, UUID, 'Kafka', others);
      break;
    default:
      logger.silly(logMessage, UUID, 'Kafka', others);
  }
};
// #endregion
