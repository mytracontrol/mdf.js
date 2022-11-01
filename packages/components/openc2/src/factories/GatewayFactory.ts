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
import { Gateway, GatewayOptions, Registry } from '@mdf.js/openc2-core';
import cluster from 'cluster';
import * as Adapters from '../adapters';
import { RedisClientOptions, SocketIOClientOptions } from '../types';

export class GatewayFactory {
  /**
   * Create an instance of OpenC2 Gateway, Redis (Consumer) to WebSocketIO (Producer)
   * @param options - Gateway configuration options
   * @param socketOptions - SocketIO configuration options
   * @param redisOptions - Redis configuration options
   */
  public static RedisToWebSocketIO(
    options: GatewayOptions,
    socketOptions?: SocketIOClientOptions,
    redisOptions?: RedisClientOptions
  ): Gateway {
    if (cluster.isWorker) {
      throw new Crash('OpenC2 Gateway can not be instantiated in a worker process');
    } else {
      const consumerAdapter = new Adapters.Redis.RedisConsumerAdapter(
        { id: options.id },
        redisOptions
      );
      const producerAdapter = new Adapters.SocketIO.SocketIOProducerAdapter(
        { id: options.id },
        socketOptions
      );
      const register =
        options.registry ??
        new Registry(options.id, options.maxInactivityTime, options.registerLimit);
      return new Gateway(consumerAdapter, producerAdapter, { ...options, registry: register });
    }
  }
  /**
   * Create an instance of OpenC2 Gateway, WebSocketIO (Consumer) to Redis (Producer)
   * @param options - Gateway configuration options
   * @param socketOptions - SocketIO configuration options
   * @param redisOptions - Redis configuration options
   */
  public static SocketIOToRedis(
    options: GatewayOptions,
    socketOptions?: SocketIOClientOptions,
    redisOptions?: RedisClientOptions
  ): Gateway {
    if (cluster.isWorker) {
      throw new Crash('OpenC2 Gateway can not be instantiated in a worker process');
    } else {
      const consumerAdapter = new Adapters.SocketIO.SocketIOConsumerAdapter(
        { id: options.id },
        socketOptions
      );
      const producerAdapter = new Adapters.Redis.RedisProducerAdapter(
        { id: options.id },
        redisOptions
      );
      const register =
        options.registry ??
        new Registry(options.id, options.maxInactivityTime, options.registerLimit);
      return new Gateway(consumerAdapter, producerAdapter, { ...options, registry: register });
    }
  }
}