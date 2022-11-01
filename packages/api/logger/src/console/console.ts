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
import Debug, { Debugger } from 'debug';
import Joi from 'joi';
import { transports } from 'winston';
import { stringFormat } from '../formats';
import { LogLevel, LOG_LEVELS } from '../types';
const { Console } = transports;

const DEFAULT_ENABLED_STATE = false;
const DEFAULT_LOG_LEVEL = 'info';

/** Winston Console transport instance interface */
type ConsoleTransportInterface = transports.ConsoleTransportInstance;
/** Console transport configuration */
export interface ConsoleTransportConfig {
  /** Console transport enabled, default: false */
  enabled?: boolean;
  /** Console log level, default: info */
  level?: LogLevel;
}
/** Console transport validation schema */
export const ConsoleTransportSchema = Joi.object<ConsoleTransportConfig>({
  enabled: Joi.boolean().default(DEFAULT_ENABLED_STATE),
  level: Joi.string()
    .allow(...LOG_LEVELS)
    .default(DEFAULT_LOG_LEVEL),
}).default();

/** Console transport management class */
export class ConsoleTransport {
  /** Debug logger for development and deep troubleshooting */
  #debug: Debugger;
  /** Default transport config */
  readonly #defaultConfig: ConsoleTransportConfig = ConsoleTransportSchema.validate({})
    .value as ConsoleTransportConfig;
  /** Transport configuration */
  readonly #config: ConsoleTransportConfig;
  /** Transport instance */
  readonly #instance: ConsoleTransportInterface;
  /**
   * Create a console transport instance
   * @param label - Logger label
   * @param uuid - uuid of the logger instance
   * @param configuration - Transport config
   */
  constructor(label: string, uuid: string, configuration?: ConsoleTransportConfig) {
    // Stryker disable all
    this.#debug = Debug('mms:logger:console');
    this.#debug(`${process.pid} - Configuration in the constructor %O`, configuration);
    // Stryker enable all
    const validation = ConsoleTransportSchema.validate(configuration);
    if (validation.error) {
      // Stryker disable next-line all
      this.#debug(`${process.pid} - Error in the configuration, default will be applied`);
      this.#config = this.#defaultConfig;
    } else {
      this.#config = validation.value;
    }
    // Stryker disable next-line all
    this.#debug(`${process.pid} - Final configuration %O`, this.#config);
    this.#instance = new Console({
      format: stringFormat(label),
      silent: !this.#config.enabled,
      level: this.#config.level,
      //consoleWarnLevels: ['error', 'warn'],
      stderrLevels: ['error', 'warn'],
    });
  }
  /** Transport configuration */
  get config(): ConsoleTransportConfig {
    return this.#config;
  }
  /** Console mode transport instance */
  get transport(): ConsoleTransportInterface {
    return this.#instance;
  }
}
