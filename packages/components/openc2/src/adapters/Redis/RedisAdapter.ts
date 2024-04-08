/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Health, Layer } from '@mdf.js/core';
import { Crash } from '@mdf.js/crash';
import { Redis } from '@mdf.js/redis-provider';
import { AdapterOptions } from '../../types';
import { Adapter } from '../Adapter';

export abstract class RedisAdapter extends Adapter implements Layer.App.Resource {
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
      config: { ...redisOptions, connectionName: `${this.name}-publisher` },
      name: `${this.name}-publisher`,
    });
    this.subscriber = Redis.Factory.create({
      config: { ...redisOptions, connectionName: `${this.name}-subscriber`, disableChecks: true },
      name: `${this.name}-subscriber`,
    });
  }
  /** Adapter health status */
  public get status(): Health.Status {
    return Health.overallStatus(this.checks);
  }
  /** Component checks */
  public get checks(): Health.Checks {
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
      await this.subscriber.client.punsubscribe(...this.subscriptions);
      await this.subscriber.stop();
    } catch (rawError) {
      const error = Crash.from(rawError);
      throw new Crash(
        `Error performing the unsubscription to OpenC2 topics: ${error.message}`,
        error.uuid,
        { cause: error }
      );
    }
  }
  /** Disconnect the OpenC2 Adapter to the underlayer transport system */
  public async close(): Promise<void> {
    try {
      await this.publisher.close();
      await this.subscriber.close();
    } catch (rawError) {
      const error = Crash.from(rawError);
      throw new Crash(`Error closing the OpenC2 adapter: ${error.message}`, error.uuid, {
        cause: error,
      });
    }
  }
}
