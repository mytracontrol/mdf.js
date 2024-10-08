/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import Debug, { Debugger } from 'debug';
import { Options, support } from 'fluent-logger';
import Joi from 'joi';
import { jsonFormat } from '../formats';
import { Logger } from '../logger';
import { LOG_LEVELS, LogLevel } from '../types';
const { winstonTransport } = support;

const DEFAULT_TAG_PATH = 'netin.';
const DEFAULT_ENABLED_STATE = false;
const DEFAULT_LOG_LEVEL = 'info';
const DEFAULT_HOST = 'localhost';
const DEFAULT_PORT = 28930;
const DEFAULT_TIMEOUT = 5000;
const DEFAULT_ACK_RESPONSE = true;
const DEFAULT_RECONNECT_INTERVAL = 5000;
const DEFAULT_EVENT_MODE = 'Message';
const DEFAULT_TLS = false;
const DEFAULT_FLUSH_INTERVAL = 2000;
const DEFAULT_MESSAGE_SEND_QUEUE_SIZE = 100 * 1024 * 1024;

/** Winston Fluentd transport instance interface */
type FluentTransportInterface = typeof support.winstonTransport;

/** Fluentd transport configuration */
export type FluentdTransportConfig = Exclude<Options, 'internalLogger'> & {
  /** Fluentd transport enabled, default: false */
  enabled?: boolean;
  /** Fluentd log level, default: info */
  level?: LogLevel;
};

/** File transport validation schema */
export const FluentdTransportSchema = Joi.object<FluentdTransportConfig>({
  enabled: Joi.boolean().default(DEFAULT_ENABLED_STATE),
  level: Joi.string()
    .allow(...LOG_LEVELS)
    .default(DEFAULT_LOG_LEVEL),
  host: Joi.string().default(DEFAULT_HOST),
  port: Joi.number().default(DEFAULT_PORT),
  timeout: Joi.number().positive().default(DEFAULT_TIMEOUT),
  requireAckResponse: Joi.boolean().default(DEFAULT_ACK_RESPONSE),
  flushInterval: Joi.number().default(DEFAULT_FLUSH_INTERVAL),
  sendQueueSizeLimit: Joi.number().default(DEFAULT_MESSAGE_SEND_QUEUE_SIZE),
  eventMode: Joi.allow('Message', 'PackedForward', 'CompressedPackedForward').default(
    DEFAULT_EVENT_MODE
  ),
  reconnectInterval: Joi.number().positive().default(DEFAULT_RECONNECT_INTERVAL),
  tls: Joi.boolean().default(DEFAULT_TLS),
  tlsOptions: Joi.alternatives().conditional('tls', {
    is: true,
    then: Joi.object().required(),
    otherwise: Joi.any(),
  }),
}).default();

/** Fluentd transport management class */
export class FluentdTransport {
  /** Debug logger for development and deep troubleshooting */
  private readonly debug: Debugger;
  /** Default transport config */
  private readonly defaultConfig: FluentdTransportConfig = FluentdTransportSchema.validate({})
    .value as FluentdTransportConfig;
  /** Transport configuration */
  private readonly _config: FluentdTransportConfig;
  /** Transport instance */
  private readonly instance: FluentTransportInterface;
  /**
   * Create a fluentd transport instance
   * @param label - Logger label
   * @param logger - Logger instance
   * @param uuid - uuid of the logger instance
   * @param configuration - Transport config
   */
  constructor(label: string, logger: Logger, uuid: string, configuration?: FluentdTransportConfig) {
    // Stryker disable all
    this.debug = Debug('mms:logger:fluentd');
    this.debug(`${process.pid} - Configuration in the constructor %O`, configuration);
    // Stryker enable all
    const validation = FluentdTransportSchema.validate(configuration);
    if (validation.error) {
      // Stryker disable next-line all
      this.debug(`${process.pid} - Error in the configuration, default will be applied`);
      this._config = this.defaultConfig;
    } else {
      this._config = validation.value;
    }
    // Stryker disable next-line all
    this.debug(`${process.pid} - Final configuration %O`, this._config);
    this.instance = new (winstonTransport())(`${DEFAULT_TAG_PATH}${label}`, {
      ...this._config,
      format: jsonFormat(label),
      internalLogger: {
        info: (message: string, data?: any, ...extra: any[]) => {
          logger.silly(message, uuid, 'Fluentd', data, ...extra);
        },
        error: (message: string, data?: any, ...extra: any[]) => {
          logger.error(message, uuid, 'Fluentd', data, ...extra);
        },
      },
    });
  }
  /** Transport configuration */
  get config(): FluentdTransportConfig {
    return this._config;
  }
  /** Mongodb mode transport instance */
  get transport(): FluentTransportInterface {
    return this.instance;
  }
}
