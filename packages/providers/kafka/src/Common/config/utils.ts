/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { KafkaJS } from '@confluentinc/kafka-javascript';
import { DebugLogger } from '@mdf.js/logger';
import _ from 'lodash';
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
  INFO = 3,
  DEBUG = 4,
}

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
  process.env['CONFIG_KAFKA_LOG_LEVEL'] ?? 'error';
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

// TODO: Check. Passing object of this type in kafkaa client config does not work,
// even when it is based in DefaultLogger implemented in the library
export class DefaultLogger implements KafkaJS.Logger {
  private logLevel: logLevel;
  // private _namespace = 'namespace';

  constructor() {
    this.logLevel = CONFIG_KAFKA_CLIENT__LOG_LEVEL;
  }

  setLogLevel(logLevel: any) {
    this.logLevel = logLevel;
  }
  info(message: string, extra?: object) {
    // TODO: Check. No label anymore
    // const logMessage = `${this._namespace} - ${message}`;
    const logMessage = `${message}`;
    logger.info(logMessage, UUID, 'Kafka', extra);
  }
  error(message: string, extra?: object) {
    // const logMessage = `${this._namespace} - ${message}`;
    const logMessage = `${message}`;
    logger.error(logMessage, UUID, 'Kafka', extra);
  }
  warn(message: string, extra?: object) {
    // const logMessage = `${this._namespace} - ${message}`;
    const logMessage = `${message}`;
    logger.warn(logMessage, UUID, 'Kafka', extra);
  }
  debug(message: string, extra?: object) {
    // const logMessage = `${this._namespace} - ${message}`;
    const logMessage = `${message}`;
    logger.debug(logMessage, UUID, 'Kafka', extra);
  }
  namespace(namespace: string, logLevel?: logLevel) {
    // this._namespace = namespace;
    // if (logLevel !== undefined) {
    //   this.logLevel = logLevel;
    // }
    return this;
  }
}
export const defaultLogger = new DefaultLogger();

export function cleanObject<T>(obj: T): T {
  if (_.isObject(obj) && !_.isArray(obj)) {
    return _.reduce(
      obj,
      (result: any, value, key) => {
        if (!_.isNil(value)) {
          result[key] = _.isObject(value) ? cleanObject(value) : value;
        }
        return result;
      },
      {}
    );
  }

  return obj;
}
// #endregion
