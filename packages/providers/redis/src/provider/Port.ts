/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Health, Layer } from '@mdf.js/core';
import { Boom, Crash, Multi } from '@mdf.js/crash';
import { LoggerInstance } from '@mdf.js/logger';
import IORedis, { RedisOptions } from 'ioredis';
import { ReplyError } from 'redis-errors';
import { CONFIG_PROVIDER_BASE_NAME } from '../config';
import type { MemoryStats, ServerStats, Status } from './Status.i';
import { Client, Config } from './types';

export class Port extends Layer.Provider.Port<Client, Config> {
  /** Redis connection handler */
  private readonly instance: Client;
  /** Event wrapping flags */
  private isWrapped: boolean;
  /** Time interval for status check */
  private timeInterval: NodeJS.Timeout | null;
  /** Is the first check */
  private isFirstCheck: boolean;
  /** Redis healthy state */
  private healthy: boolean;
  /**
   * Instance is connected, this is necessary to manage the reconnection process. When `start` is
   * called, the instance will try to reconnect to the server if the connection is lost, so `start`
   * so not be called again.
   */
  private connected: boolean;
  /** Time interval for ready check request */
  private readonly interval: number;
  /**
   * Implementation of functionalities of a Redis port instance.
   * @param config - Port configuration options
   * @param logger - Port logger, to be used internally
   */
  constructor(config: Config, logger: LoggerInstance) {
    super(config, logger, config.name ?? CONFIG_PROVIDER_BASE_NAME);
    const cleanedOptions = {
      ...this.config,
      checkInterval: undefined,
      disableChecks: undefined,
    } as RedisOptions;
    this.instance = new IORedis({ ...cleanedOptions, lazyConnect: true });
    // Stryker disable next-line all
    this.logger.debug(`New instance of Redis port created: ${this.uuid}`, this.uuid, this.name);
    this.interval = this.config.checkInterval as number;
    this.isWrapped = false;
    this.connected = false;
    this.healthy = false;
    this.timeInterval = null;
    this.isFirstCheck = true;
  }
  /** Return the underlying port instance */
  public get client(): Client {
    return this.instance;
  }
  /** Return the port state as a boolean value, true if the port is available, false in otherwise */
  public get state(): boolean {
    return this.instance.status === 'ready';
  }
  /** Start the port, making it available */
  public async start(): Promise<void> {
    if (this.connected) {
      // Stryker disable next-line all
      this.logger.warn(`Port already connected, skipping start`);
      return;
    }
    try {
      await this.instance.connect();
      this.connected = true;
      this.eventsWrapping(this.instance);
      if (!this.timeInterval && !this.config.disableChecks) {
        this.timeInterval = setInterval(this.statusCheck, this.interval);
        this.statusCheck();
      }
    } catch (rawError) {
      const cause = Crash.from(rawError, this.uuid);
      if (cause.message !== 'Redis is already connecting/connected') {
        throw new Crash(`Error performing the connection to Redis instance: ${cause.message}`, {
          cause: cause,
        });
      }
    }
  }
  /** Stop the port, making it unavailable */
  public async stop(): Promise<void> {
    if (!this.connected) {
      // Stryker disable next-line all
      this.logger.warn(`Port already disconnected, skipping stop`);
      return;
    }
    try {
      this.eventsUnwrapping(this.instance);
      await this.instance.quit();
      this.connected = false;
    } catch (rawError) {
      const cause = Crash.from(rawError, this.uuid);
      if (cause.message !== 'Connection is closed.') {
        throw new Crash(`Error performing the disconnection to Redis instance: ${cause.message}`, {
          cause,
        });
      }
    } finally {
      if (this.timeInterval) {
        clearInterval(this.timeInterval);
        this.timeInterval = null;
      }
      this.healthy = false;
    }
  }
  /** Close the port, alias to stop */
  public async close(): Promise<void> {
    await this.stop();
  }
  /**
   * Parse string formatted stats from Redis INFO command to JSON
   * @param stat - stat to be parsed
   * @returns
   */
  private parseStats<T>(stat: string): T {
    try {
      return JSON.parse(
        `{${stat
          .split('\r\n')
          .slice(1, -1)
          .map(entry => `"${entry.replace(':', '":"')}"`)
          .join(',')}}`
      );
    } catch (rawError) {
      const error = Crash.from(rawError, this.uuid);
      // Stryker disable next-line all
      this.logger.warn(`Error parsing instance stats: ${error.message}`, this.uuid, this.name);
      return { errorParsing: error.message } as unknown as T;
    }
  }
  /** Get the Memory and Server stats from Redis INFO command */
  private getInfoStats(): Promise<Status> {
    const stats: Status = {
      server: {},
      memory: {},
    } as Status;
    return new Promise((resolve, reject) => {
      this.instance
        .info('server')
        .then(result => (stats.server = this.parseStats<ServerStats>(result)))
        .then(() => this.instance.info('memory'))
        .then(result => (stats.memory = this.parseStats<MemoryStats>(result)))
        .then(() => resolve(stats))
        .catch(rawError => {
          let error: Crash | Multi | Boom;
          if (rawError instanceof ReplyError) {
            error = this.errorParse(rawError);
          } else {
            error = Crash.from(rawError, this.uuid);
          }
          reject(new Crash(`Error getting the Redis INFO stats`, this.uuid, { cause: error }));
        });
    });
  }
  /** Check the server and memory status of the redis server instance  */
  private readonly statusCheck = (): void => {
    this.getInfoStats()
      .then(result => {
        // Stryker disable next-line all
        this.logger.debug(`Status check command performed successfully`, this.uuid, this.name);
        this.evaluateStats(result);
      })
      .catch(rawError => {
        const error = Crash.from(rawError, this.uuid);
        this.emit(
          'error',
          new Crash(`Error performing the status check of the Redis instance`, this.uuid, {
            cause: error,
          })
        );
      })
      .finally(() => {
        this.isFirstCheck = false;
      });
  };
  /**
   * Check the results and emit the healthy or unhealthy event
   * @param result - The result of the status check
   * @returns
   */
  private evaluateStats(result: Status): Status {
    let message: string | undefined;
    let hasError = false;
    const observedValue = this.calculateObservedValue(result);
    const parsingError = result.memory.errorParsing ?? result.server.errorParsing;
    let usage = 0;

    if (parsingError) {
      message = `Error parsing the Redis INFO stats: ${parsingError}, please contact with the developers`;
      hasError = true;
    } else {
      usage = this.calculateMemoryUsage(result);
      ({ hasError, message } = this.determineMemoryStatus(usage, result, hasError));
    }

    const usageStatus: Health.Status = usage > 0.8 ? 'warn' : 'pass';
    const status = hasError ? 'fail' : usageStatus;

    this.addCheck('memory', {
      componentId: this.uuid,
      observedValue,
      observedUnit: 'used memory / max memory',
      status,
      output: message,
      time: new Date().toISOString(),
    });

    this.emitHealthStatus(hasError, message);
    return result;
  }
  /**
   * Calculate the observed value for memory usage.
   * @param result - The result of the status check
   * @returns The observed value as a string.
   */
  private calculateObservedValue(result: Status): string {
    if (!result.memory.used_memory && !result.memory.maxmemory) {
      return '- bytes / - bytes';
    }
    return `${result.memory.used_memory} / ${result.memory.maxmemory}`;
  }
  /**
   * Calculate memory usage percentage.
   * @param result - The result of the status check
   * @returns The memory usage as a percentage.
   */
  private calculateMemoryUsage(result: Status): number {
    return result.memory.maxmemory !== '0'
      ? parseFloat(result.memory.used_memory) / parseFloat(result.memory.maxmemory)
      : 0;
  }
  /**
   * Determine the memory status and create an appropriate message.
   * @param usage - The memory usage percentage.
   * @param result - The result of the status check.
   * @param hasError - A flag indicating if there's an error.
   * @returns An object containing the updated hasError flag and message.
   */
  private determineMemoryStatus(
    usage: number,
    result: Status,
    hasError: boolean
  ): { hasError: boolean; message: string | undefined } {
    let message: string | undefined;

    if (usage >= 1) {
      hasError = true;
      message = `The system is OOM - used ${result.memory.used_memory_human} - max ${result.memory.maxmemory_human}`;
    } else if (usage > 0.9) {
      message = `The system is using more than 90% of the available memory`;
    } else if (usage > 0.8) {
      message = `The system is using more than 80% of the available memory`;
    } else {
      message = `The system is using ${(usage * 100).toFixed(2)}% of the available memory`;
    }

    return { hasError, message };
  }
  /**
   * Emit the appropriate health status event based on the current state.
   * @param hasError - Indicates if an error was detected.
   * @param message - The error message, if any.
   */
  private emitHealthStatus(hasError: boolean, message: string | undefined): void {
    if (hasError && (this.healthy || this.isFirstCheck)) {
      this.emit('unhealthy', new Crash(message ?? 'Unexpected error in the evaluation', this.uuid));
      this.healthy = false;
    } else if (!hasError && !this.healthy) {
      this.emit('healthy');
      this.healthy = true;
    }
  }
  /**
   * Auxiliar function to log and emit events
   * @param event - event name
   * @param args - arguments to be emitted with the event
   */
  private onEvent(event: string, ...args: (Crash | Status | number)[]): void {
    // Stryker disable next-line all
    this.logger.debug(`Event: ${event} was listened`);
    for (const arg of args) {
      // Stryker disable next-line all
      this.logger.silly(`Event ${event} arg: ${JSON.stringify(arg)}`);
    }
  }
  /** Callback function for `connect` event */
  private readonly onConnectEvent = () => this.onEvent('connect');
  /** Callback function for `ready` event */
  private readonly onReadyEvent = () => {
    // Stryker disable next-line all
    this.logger.debug(`Original event: ready was wrapped to healthy`);
    this.emit('healthy');
  };
  /** Callback function for `error` event */
  private readonly onErrorEvent = (rawError: ReplyError) => {
    // Stryker disable next-line all
    this.logger.error(`Error event: error was wrapped to error`);
    const error = this.errorParse(rawError);
    this.emit('error', error);
  };
  /** Callback function for `close` event */
  private readonly onCloseEvent = () => {
    // Stryker disable next-line all
    this.logger.debug(`Original event: close was wrapped to unhealthy`);
    this.emit('unhealthy', new Crash(`The connection was closed unexpectedly`, this.uuid));
  };
  /** Callback function for `reconnecting` event */
  private readonly onReconnectingEvent = (delay: number) => this.onEvent('reconnecting', delay);
  /** Callback function for `end` event */
  private readonly onEndEvent = () => {
    // Stryker disable next-line all
    this.logger.debug(`Original event: end was wrapped to closed`);
    this.emit('closed', new Crash(`The connection was closed intentionally`, this.uuid));
  };
  /** Callback function for `+node` event */
  private readonly onPlusNodeEvent = () => this.onEvent('+node');
  /** Callback function for `-node` event */
  private readonly onMinusNodeEvent = () => this.onEvent('-node');
  /**
   * Transforms a ReplyError instance to a Crash instance
   * @param error - Error to be parsed
   * @returns
   */
  private errorParse(error: ReplyError): Crash {
    let message = error.message;
    /** Redis is requesting AUTH */
    if (error.message.includes('NOAUTH Authentication required')) {
      message = 'No authentication config for RDB connection';
    } else if (error.message.includes('ERR invalid password')) {
      message = 'Wrong authentication config on RDB connection';
    }
    return new Crash(message, this.uuid, {
      name: error.name,
      cause: Crash.from(error, this.uuid),
      info: {
        uuid: this.uuid,
        redisState: this.instance.status,
      },
    });
  }
  /**
   * Adapts the `ioredis` instance events to standard Port events
   * @param instance - Redis instance over which the events should be wrapped
   */
  private eventsWrapping(instance: Client): void {
    if (this.isWrapped) {
      return;
    }
    instance.on('connect', this.onConnectEvent);
    instance.on('ready', this.onReadyEvent);
    instance.on('error', this.onErrorEvent);
    instance.on('close', this.onCloseEvent);
    instance.on('reconnecting', this.onReconnectingEvent);
    instance.on('end', this.onEndEvent);
    instance.on('+node', this.onPlusNodeEvent);
    instance.on('-node', this.onMinusNodeEvent);
    this.isWrapped = true;
  }
  /**
   * Clean all the events handlers
   * @param instance - Redis instance over which the events should be cleaned
   */
  private eventsUnwrapping(instance: Client): void {
    instance.off('connect', this.onConnectEvent);
    instance.off('ready', this.onReadyEvent);
    instance.off('error', this.onErrorEvent);
    instance.off('close', this.onCloseEvent);
    instance.off('reconnecting', this.onReconnectingEvent);
    instance.off('end', this.onEndEvent);
    instance.off('+node', this.onPlusNodeEvent);
    instance.off('-node', this.onMinusNodeEvent);
    this.isWrapped = false;
  }
}
