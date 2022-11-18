/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash } from '@mdf.js/crash';
import { Consumer, ConsumerOptions, Registry } from '@mdf.js/openc2-core';
import cluster from 'cluster';
import * as Adapters from '../adapters';
import { RedisClientOptions, SocketIOClientOptions } from '../types';

export class ConsumerFactory {
  /**
   * Create an instance of OpenC2 Consumer with Redis interface
   * @param options - Consumer configuration options
   * @param redisOptions - Redis configuration options
   */
  public static Redis(options: ConsumerOptions, redisOptions?: RedisClientOptions): Consumer {
    if (cluster.isWorker) {
      throw new Crash('OpenC2 Consumer can not be instantiated in a worker process');
    } else {
      const adapter = new Adapters.Redis.RedisConsumerAdapter({ id: options.id }, redisOptions);
      const register =
        options.registry ??
        new Registry(options.id, options.maxInactivityTime, options.registerLimit);
      return new Consumer(adapter, { ...options, registry: register });
    }
  }
  /**
   * Create an instance of OpenC2 Consumer with SocketIO interface
   * @param options - Consumer configuration options
   * @param socketOptions - SocketIO configuration options
   */
  public static SocketIO(
    options: ConsumerOptions,
    socketOptions?: SocketIOClientOptions
  ): Consumer {
    if (cluster.isWorker) {
      throw new Crash('OpenC2 Consumer can not be instantiated in a worker process');
    } else {
      const adapter = new Adapters.SocketIO.SocketIOConsumerAdapter(
        { id: options.id },
        socketOptions
      );
      const register =
        options.registry ??
        new Registry(options.id, options.maxInactivityTime, options.registerLimit);
      return new Consumer(adapter, { ...options, registry: register });
    }
  }
}
