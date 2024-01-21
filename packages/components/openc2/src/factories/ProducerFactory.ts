/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash } from '@mdf.js/crash';
import { Producer, ProducerOptions, Registry } from '@mdf.js/openc2-core';
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
