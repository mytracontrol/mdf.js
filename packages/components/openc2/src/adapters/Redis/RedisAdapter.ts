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

import { Health } from '@mdf.js/core';
import { Crash } from '@mdf.js/crash';
import { Redis } from '@mdf.js/redis-provider';
import { AdapterOptions } from '../../types';
import { Adapter } from '../Adapter';

export abstract class RedisAdapter extends Adapter implements Health.Component {
  /** Redis instance used as publisher */
  protected readonly publisher: Redis.Provider;
  /** Redis instance used as subscriber */
  protected readonly subscriber: Redis.Provider;
  /**
   * Create a new OpenC2 adapter for Redis
   * @param adapterOptions - Adapter configuration options
   * @param redisOptions - Redis configuration options
   * @param type - component type
   */
  constructor(
    adapterOptions: AdapterOptions,
    type: 'producer' | 'consumer',
    redisOptions?: Redis.Config
  ) {
    super(adapterOptions, type);
    this.publisher = Redis.Factory.create({
      config: redisOptions,
      name: `${this.name}-publisher`,
    });
    this.subscriber = Redis.Factory.create({
      config: { ...redisOptions, disableChecks: true },
      name: `${this.name}-subscriber`,
    });
  }
  /** Component checks */
  public get checks(): Health.API.Checks {
    return {
      ...this.publisher.checks,
      ...this.subscriber.checks,
    };
  }
  /** Connect the OpenC2 Adapter to the underlayer transport system */
  public async start(): Promise<void> {
    try {
      await this.publisher.start();
      await this.subscriber.start();
      await this.subscriber.client.psubscribe(...this.subscriptions);
    } catch (rawError) {
      const error = Crash.from(rawError);
      throw new Crash(
        `Error performing the subscription to OpenC2 topics: ${error.message}`,
        error.uuid,
        { cause: error }
      );
    }
  }
  /** Connect the OpenC2 Adapter to the underlayer transport system */
  public async stop(): Promise<void> {
    try {
      await this.publisher.stop();
      await this.subscriber.stop();
      await this.subscriber.client.punsubscribe(...this.subscriptions);
    } catch (rawError) {
      const error = Crash.from(rawError);
      throw new Crash(
        `Error performing the unsubscription to OpenC2 topics: ${error.message}`,
        error.uuid,
        { cause: error }
      );
    }
  }
}
