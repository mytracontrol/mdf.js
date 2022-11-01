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

import { Crash } from '@mdf/crash';
import { Producer, ProducerOptions, Registry } from '@mdf/openc2-core';
import cluster from 'cluster';
import * as Adapters from '../adapters';
import { RedisClientOptions, SocketIOClientOptions } from '../types';

export class ProducerFactory {
  /**
   * Create an instance of OpenC2 Producer with Redis interface
   * @param options - Producer configuration options
   * @param redisOptions - Redis configuration options
   */
  public static Redis(options: ProducerOptions, redisOptions?: RedisClientOptions): Producer {
    if (cluster.isWorker) {
      throw new Crash('OpenC2 Producer can not be instantiated in a worker process');
    } else {
      const adapter = new Adapters.Redis.RedisProducerAdapter({ id: options.id }, redisOptions);
      const register =
        options.registry ??
        new Registry(options.id, options.maxInactivityTime, options.registerLimit);
      return new Producer(adapter, { ...options, registry: register });
    }
  }
  /**
   * Create an instance of OpenC2 Producer with SocketIO interface
   * @param options - Producer configuration options
   * @param socketOptions - SocketIO configuration options
   */
  public static SocketIO(
    options: ProducerOptions,
    socketOptions?: SocketIOClientOptions
  ): Producer {
    if (cluster.isWorker) {
      throw new Crash('OpenC2 Producer can not be instantiated in a worker process');
    } else {
      const adapter = new Adapters.SocketIO.SocketIOProducerAdapter(
        { id: options.id },
        socketOptions
      );
      const register =
        options.registry ??
        new Registry(options.id, options.maxInactivityTime, options.registerLimit);
      return new Producer(adapter, { ...options, registry: register });
    }
  }
}
