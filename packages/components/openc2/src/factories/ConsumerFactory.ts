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
